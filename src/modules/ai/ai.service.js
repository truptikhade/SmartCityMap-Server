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
  | Fetch application places
  |--------------------------------------------------------------------------
  |
  | These places are OPTIONAL context for Gemini.
  | Gemini is NOT restricted to this dataset.
  |
  */

  let normalizedPlaces = []

  try {
    const places =
      await getAllPlaces()

    normalizedPlaces =
      places.map((place) =>
        normalizePlace(
          place,
          userLat,
          userLng
        )
      )
  } catch (error) {
    console.error(
      'Failed to fetch places for AI:',
      error
    )
  }

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
  | Prepare database context for Gemini
  |--------------------------------------------------------------------------
  */

  const placesForAI =
    sortedPlaces.slice(0, 150)

  const placeList =
    placesForAI.length > 0
      ? placesForAI
          .map(
            (place, index) =>
              `${index + 1}. ${JSON.stringify(
                place
              )}`
          )
          .join('\n')
      : 'No application places are currently available.'

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
  | Prompt
  |--------------------------------------------------------------------------
  */

  const prompt = `
You are SmartCity Assistant for a city discovery
and public transportation application.

You help users with:

- cities
- tourism
- food
- attractions
- transportation
- local specialties
- restaurants
- shopping
- things to do
- nearby places

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

The SmartCity application has these places
available in its database:

${placeList}

IMPORTANT RULES:

1. You are NOT restricted to the database.

2. You may answer general knowledge questions
   using your own knowledge.

3. For example, if the user asks:

   "What are Pune specialties?"

   you can answer about Pune even if Pune
   is not present in the SmartCity database.

4. If the user asks:

   "What is Pune famous for?"

   answer normally using your knowledge.

5. If the user asks about food, culture,
   tourism, history, transportation, cities,
   regions or general information, provide
   a useful natural answer.

6. If the user asks for nearby places,
   restaurants, attractions, shopping or
   places that should be displayed on the
   SmartCity map, prefer relevant places
   from the application database.

7. When recommending a database place,
   return its EXACT database ID.

8. NEVER invent a database ID.

9. NEVER invent coordinates.

10. A place can only be shown on the
    SmartCity map if it comes from the
    application database and has valid
    coordinates.

11. If you mention a real-world place from
    general knowledge that is not in the
    application database, you may mention it
    in your answer, but DO NOT create a fake
    database ID for it.

12. If the user asks "near me", "nearby",
    "closest", "around me", or similar
    location-based questions, consider the
    user's coordinates when available.

13. Consider distance when selecting nearby
    database places.

14. Consider category, type and specialty.

15. Consider rating when useful.

16. Do not restrict recommendations to an
    arbitrary 3 km radius.

17. If the database does not contain a
    suitable place, you can still answer
    the user's general question.

18. Do not return unrelated database places
    just to fill the recommendation list.

19. Return fewer recommendations when there
    are fewer genuinely relevant places.

20. Maximum 10 database place IDs.

21. The "message" should directly answer
    the user's question.

22. The "recommendations" array should
    contain ONLY database place IDs that
    are actually relevant to the request.

23. For a general knowledge question,
    recommendations can be an empty array.

24. NEVER invent an ID for a place that
    is not in the database.

Return ONLY valid JSON:

{
  "message": "Short natural response to the user.",
  "recommendations": [
    {
      "id": "database-place-id"
    }
  ]
}
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
  | Gemini failed
  |--------------------------------------------------------------------------
  */

  if (!aiResult) {
    return {
      recommendations: [],
      aiMessage:
        'I could not process that request right now. Please try again.',
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
    Array.isArray(
      aiResult.recommendations
    )
      ? aiResult.recommendations
          .map((item) => {
            if (!item?.id) {
              return null
            }

            /*
             * Only accept IDs that actually
             * exist in our database.
             */
            const place =
              placeMap.get(
                String(item.id)
              )

            if (!place) {
              return null
            }

            return place
          })
          .filter(Boolean)
          .slice(0, 10)
      : []

  /*
  |--------------------------------------------------------------------------
  | Final response
  |--------------------------------------------------------------------------
  */

  return {
    recommendations,

    aiMessage:
      aiResult.message ||
      `Here is what I found about "${question}".`,
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
  | Existing database specialties
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
  | Gemini specialties
  |--------------------------------------------------------------------------
  */

  try {
    const response =
      await ai.models.generateContent({
        model: 'gemini-3.8-flash',

        contents: `
Provide useful specialties or things
this place is known for.

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

Rules:

- Describe this actual place.
- Do not invent another place.
- Return useful and specific specialties.
- Return between 3 and 10 specialties.
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
          ? parsed.specialties
              .slice(0, 10)
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