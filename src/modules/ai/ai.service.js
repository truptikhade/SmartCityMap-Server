const { GoogleGenAI } = require('@google/genai')
const prisma = require('../../config/prisma')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const safeNumber = (value) => {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : null
}

const getPlaceCoordinates = (place) => {
  const lat =
    safeNumber(place.latitude) ??
    safeNumber(place.lat)

  const lng =
    safeNumber(place.longitude) ??
    safeNumber(place.lng)

  return {
    lat,
    lng,
  }
}

const haversineKm = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )

  return R * c
}

/*
|--------------------------------------------------------------------------
| Normalize place
|--------------------------------------------------------------------------
*/

const normalizePlace = (
  place,
  userLat = null,
  userLng = null
) => {
  const coordinates =
    getPlaceCoordinates(place)

  let distanceKm = null

  if (
    userLat !== null &&
    userLng !== null &&
    coordinates.lat !== null &&
    coordinates.lng !== null
  ) {
    distanceKm = haversineKm(
      userLat,
      userLng,
      coordinates.lat,
      coordinates.lng
    )
  }

  return {
    id: place.id,
    name: place.name,

    category:
      place.category ||
      place.type ||
      place.placeType ||
      null,

    type:
      place.type ||
      place.category ||
      place.placeType ||
      null,

    specialty:
      place.specialty ||
      null,

    description:
      place.description ||
      null,

    address:
      place.address ||
      place.location ||
      null,

    city:
      place.city ||
      null,

    rating:
      place.rating !== null &&
      place.rating !== undefined
        ? Number(place.rating)
        : null,

    latitude:
      coordinates.lat,

    longitude:
      coordinates.lng,

    lat:
      coordinates.lat,

    lng:
      coordinates.lng,

    distanceKm:
      distanceKm !== null
        ? Number(
            distanceKm.toFixed(2)
          )
        : null,
  }
}

/*
|--------------------------------------------------------------------------
| Get all places
|--------------------------------------------------------------------------
*/

const getAllPlaces = async () => {
  return prisma.place.findMany({
    take: 200,
  })
}

/*
|--------------------------------------------------------------------------
| AI Recommendations
|--------------------------------------------------------------------------
*/

const getNearbyRecommendations = async ({
  lat,
  lng,
  message,
}) => {
  const userLat = safeNumber(lat)
  const userLng = safeNumber(lng)

  const question =
    String(message || '').trim()

  if (!question) {
    return {
      recommendations: [],
      aiMessage:
        'Please tell me what you are looking for.',
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Fetch places from entire dataset
  |--------------------------------------------------------------------------
  */

  const places =
    await getAllPlaces()

  if (!places.length) {
    return {
      recommendations: [],
      aiMessage:
        'I could not find any places in the database.',
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize places
  |--------------------------------------------------------------------------
  */

  const normalizedPlaces =
    places.map((place) =>
      normalizePlace(
        place,
        userLat,
        userLng
      )
    )

  /*
  |--------------------------------------------------------------------------
  | Sort nearby places first
  |--------------------------------------------------------------------------
  */

  const sortedPlaces =
    [...normalizedPlaces].sort(
      (a, b) => {
        if (
          a.distanceKm === null &&
          b.distanceKm === null
        ) {
          return 0
        }

        if (a.distanceKm === null) {
          return 1
        }

        if (b.distanceKm === null) {
          return -1
        }

        return (
          a.distanceKm -
          b.distanceKm
        )
      }
    )

  /*
  |--------------------------------------------------------------------------
  | Limit data sent to Gemini
  |--------------------------------------------------------------------------
  */

  const placesForAI =
    sortedPlaces.slice(0, 150)

  /*
  |--------------------------------------------------------------------------
  | Time context
  |--------------------------------------------------------------------------
  */

  const now = new Date()

  const hour = now.getHours()

  let timeOfDay = 'day'

  if (hour >= 5 && hour < 12) {
    timeOfDay = 'morning'
  } else if (
    hour >= 12 &&
    hour < 17
  ) {
    timeOfDay = 'afternoon'
  } else if (
    hour >= 17 &&
    hour < 21
  ) {
    timeOfDay = 'evening'
  } else {
    timeOfDay = 'night'
  }

  /*
  |--------------------------------------------------------------------------
  | Dataset for Gemini
  |--------------------------------------------------------------------------
  */

  const placeList =
    placesForAI
      .map(
        (place, index) =>
          `${index + 1}. ${JSON.stringify(
            place
          )}`
      )
      .join('\n')

  /*
  |--------------------------------------------------------------------------
  | Prompt
  |--------------------------------------------------------------------------
  */

  const prompt = `
You are SmartCity Assistant for a city discovery
and public transportation application.

The user asked:

"${question}"

Current time of day:
${timeOfDay}

User location:
${
  userLat !== null &&
  userLng !== null
    ? `${userLat}, ${userLng}`
    : 'not provided'
}

Below is the list of places available in our
database.

IMPORTANT RULES:

1. Only recommend places from the provided dataset.
2. Never invent a place.
3. Do not create fake coordinates.
4. Return up to 10 relevant places.
5. Return fewer only when there are genuinely
   fewer relevant places.
6. Consider the user's question carefully.
7. Consider category/type/specialty.
8. Consider distance when user coordinates
   are available.
9. Consider rating when useful.
10. Do not restrict recommendations to an
    arbitrary 3 km radius.
11. If the user asks for a specific category,
    prioritize that category.
12. If the user asks about a city or region,
    return relevant places from that region
    available in the dataset.

Return ONLY valid JSON in this format:

{
  "message": "Short natural response to the user.",
  "recommendations": [
    {
      "id": "place-id"
    }
  ]
}

Return at most 10 place IDs.

Available places:

${placeList}
`

  /*
  |--------------------------------------------------------------------------
  | Gemini request
  |--------------------------------------------------------------------------
  */

  let aiResult = null

  try {
    const response =
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',

        contents: prompt,

        config: {
          responseMimeType:
            'application/json',

          temperature: 0.2,
        },
      })

    const text =
      response?.text || ''

    if (text) {
      try {
        aiResult =
          JSON.parse(text)
      } catch (parseError) {
        console.error(
          'Gemini JSON parse error:',
          parseError
        )
      }
    }
  } catch (error) {
    console.error(
      'Gemini recommendation error:',
      error
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Gemini fallback
  |--------------------------------------------------------------------------
  */

  if (
    !aiResult ||
    !Array.isArray(
      aiResult.recommendations
    )
  ) {
    const fallback =
      [...sortedPlaces]
        .sort((a, b) => {
          const ratingA =
            Number(a.rating) || 0

          const ratingB =
            Number(b.rating) || 0

          if (
            ratingA !== ratingB
          ) {
            return (
              ratingB -
              ratingA
            )
          }

          if (
            a.distanceKm !== null &&
            b.distanceKm !== null
          ) {
            return (
              a.distanceKm -
              b.distanceKm
            )
          }

          return 0
        })
        .slice(0, 10)

    return {
      recommendations:
        fallback,

      aiMessage:
        `Here are some places from our database that may be useful for "${question}".`,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Match Gemini IDs with real database places
  |--------------------------------------------------------------------------
  */

  const placeMap =
    new Map(
      normalizedPlaces.map(
        (place) => [
          String(place.id),
          place,
        ]
      )
    )

  const recommendations =
    aiResult.recommendations
      .map((item) => {
        if (!item?.id) {
          return null
        }

        return placeMap.get(
          String(item.id)
        )
      })
      .filter(Boolean)
      .slice(0, 10)

  /*
  |--------------------------------------------------------------------------
  | If Gemini returned invalid IDs
  |--------------------------------------------------------------------------
  */

  if (!recommendations.length) {
    const fallback =
      [...sortedPlaces]
        .sort((a, b) => {
          const ratingA =
            Number(a.rating) || 0

          const ratingB =
            Number(b.rating) || 0

          if (
            ratingA !== ratingB
          ) {
            return (
              ratingB -
              ratingA
            )
          }

          if (
            a.distanceKm !== null &&
            b.distanceKm !== null
          ) {
            return (
              a.distanceKm -
              b.distanceKm
            )
          }

          return 0
        })
        .slice(0, 10)

    return {
      recommendations:
        fallback,

      aiMessage:
        `Here are some places from our database that may be useful for "${question}".`,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Final response
  |--------------------------------------------------------------------------
  */

  return {
    recommendations,

    aiMessage:
      aiResult.message ||
      `Here are some recommendations for "${question}".`,
  }
}

/*
|--------------------------------------------------------------------------
| Place Specialties
|--------------------------------------------------------------------------
*/

const getPlaceSpecialties = async (
  placeId
) => {
  const place =
    await prisma.place.findUnique({
      where: {
        id: placeId,
      },
    })

  if (!place) {
    return {
      specialties: [],
    }
  }

  /*
  |--------------------------------------------------------------------------
  | If your place model already stores specialties,
  | return them directly.
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      place.specialties
    )
  ) {
    return {
      specialties:
        place.specialties,
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Gemini fallback
  |--------------------------------------------------------------------------
  */

  try {
    const response =
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',

        contents: `
Provide useful specialties or things this
place is known for.

Place:
${JSON.stringify({
  name: place.name,
  category:
    place.category ||
    place.type,
  description:
    place.description,
})}

Return JSON only:

{
  "specialties": [
    "specialty 1",
    "specialty 2",
    "specialty 3",
    "specialty 4",
    "specialty 5"
  ]
}
`,

        config: {
          responseMimeType:
            'application/json',

          temperature: 0.2,
        },
      })

    const text =
      response?.text || ''

    const parsed =
      JSON.parse(text)

    return {
      specialties:
        Array.isArray(
          parsed.specialties
        )
          ? parsed.specialties.slice(
              0,
              10
            )
          : [],
    }
  } catch (error) {
    console.error(
      'Gemini specialties error:',
      error
    )

    return {
      specialties: [],
    }
  }
}

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  getNearbyRecommendations,
  getPlaceSpecialties,
}