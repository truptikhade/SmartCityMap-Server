import prisma from "../../config/prisma.js";
import { Prisma } from "@prisma/client";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Map your app's categories to real OpenStreetMap tags
const CATEGORY_TAGS = {
  hospital: ["amenity=hospital"],
  restaurant: ["amenity=restaurant", "amenity=fast_food"],
  market: ["shop=supermarket", "shop=marketplace", "shop=convenience"],
  temple: ["amenity=place_of_worship"],
  atm: ["amenity=atm"],
  pharmacy: ["amenity=pharmacy"],
  school: ["amenity=school"],
  hotel: ["tourism=hotel"],
  park: ["leisure=park"],
};

const ALL_TAGS = Object.values(CATEGORY_TAGS).flat();

const tagToCategory = (tags = {}) => {
  for (const [category, tagList] of Object.entries(CATEGORY_TAGS)) {
    for (const tag of tagList) {
      const [key, value] = tag.split("=");
      if (tags[key] === value) return category;
    }
  }
  return "other";
};

const buildOverpassQuery = ({ lat, lng, radius, category }) => {
  if (category === "other") {
    return `[out:json][timeout:20];(
      node["name"](around:${radius},${lat},${lng});
      way["name"](around:${radius},${lat},${lng});
    );out center 50;`;
  }

  const tags = category ? CATEGORY_TAGS[category] || [] : ALL_TAGS;
  if (tags.length === 0) return null;

  // Only include slower "way" queries when a specific category is chosen —
  // querying ways across ALL categories at once is what triggers Overpass 504s
  const includeWays = Boolean(category);

  const filters = tags
    .map((tag) => {
      const [key, value] = tag.split("=");
      return includeWays
        ? `
          node["${key}"="${value}"](around:${radius},${lat},${lng});
          way["${key}"="${value}"](around:${radius},${lat},${lng});
        `
        : `
          node["${key}"="${value}"](around:${radius},${lat},${lng});
        `;
    })
    .join("");

  return `[out:json][timeout:20];(${filters});out center 50;`;
};

const fetchFromOverpass = async ({ lat, lng, radius, category }) => {
  const query = buildOverpassQuery({ lat, lng, radius, category });
  if (!query) return [];

  const body = new URLSearchParams({ data: query });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "SmartCityMap/1.0 (development)",
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Overpass API error:", res.status, text.slice(0, 300));
      return [];
    }

    const data = await res.json();
    return data.elements || [];
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("Overpass request timed out");
    } else {
      console.error("Overpass fetch failed:", err.message);
    }
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
};

const elementToPlaceData = (el) => {
  const tags = el.tags || {};
  const elLat = el.lat ?? el.center?.lat;
  const elLng = el.lon ?? el.center?.lon;
  if (elLat == null || elLng == null || !tags.name) return null;

  const addressParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:city"],
  ].filter(Boolean);

  return {
    osmId: `${el.type}/${el.id}`,
    name: tags.name,
    category: tagToCategory(tags),
    address: addressParts.join(", ") || null,
    openHours: tags.opening_hours || null,
    lat: elLat,
    lng: elLng,
  };
};

//  Nearby Places (live from OpenStreetMap, cached locally)
const findNearby = async ({ lat, lng, radius = 2000, category, search }) => {
  const elements = await fetchFromOverpass({ lat, lng, radius, category });
  const candidates = elements.map(elementToPlaceData).filter(Boolean);

  // Upsert each into the local table so ids/reviews/ratings work normally
  await Promise.all(
    candidates.map((data) =>
      prisma.place.upsert({
        where: { osmId: data.osmId },
        update: {
          name: data.name,
          address: data.address,
          openHours: data.openHours,
          lat: data.lat,
          lng: data.lng,
        },
        create: data,
      }),
    ),
  );

  const categoryFilter = category
    ? Prisma.sql`AND p.category = ${category}`
    : Prisma.empty;
  const searchFilter = search
    ? Prisma.sql`AND (
        strpos(lower(p.name), lower(${search})) > 0
        OR strpos(lower(COALESCE(p.address, '')), lower(${search})) > 0
        OR strpos(lower(p.category), lower(${search})) > 0
      )`
    : Prisma.empty;

  return prisma.$queryRaw`
    SELECT
      p.id,
      p.name,
      p.category,
      p.address,
      p.rating,
      p."openHours",
      p.lat,
      p.lng,
      p."createdAt",
      p."osmId",
      ROUND(
        ST_Distance(
          p.location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )::numeric,
        2
      )::double precision AS distance
    FROM geo.places AS p
    WHERE ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radius}
    )
    ${categoryFilter}
    ${searchFilter}
    ORDER BY distance ASC
    LIMIT 50
  `;
};

//  everything below is unchanged from your original file

const findById = async (id) => {
  return prisma.place.findUnique({
    where: { id },
    include: {
      nearbySpecialties: true,
      reviews: {
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
};

const findAllPlaces = async ({ category, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = category ? { category } : {};

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      skip,
      take: limit,
      orderBy: { rating: "desc" },
    }),
    prisma.place.count({ where }),
  ]);

  return { places, total, page, limit };
};

const createPlace = async ({
  name,
  category,
  address,
  openHours,
  lat,
  lng,
}) => {
  return prisma.place.create({
    data: { name, category, address, openHours, lat, lng },
  });
};

const findReviews = async (placeId) => {
  return prisma.review.findMany({
    where: { placeId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
};

const createReview = async ({ userId, placeId, rating, comment }) => {
  return prisma.review.create({
    data: { userId, placeId, rating, comment },
    include: { user: true },
  });
};

const findExistingReview = async (userId, placeId) => {
  return prisma.review.findUnique({
    where: { userId_placeId: { userId, placeId } },
  });
};

const updatePlaceRating = async (placeId) => {
  const result = await prisma.review.aggregate({
    where: { placeId },
    _avg: { rating: true },
  });
  return prisma.place.update({
    where: { id: placeId },
    data: { rating: result._avg.rating || 0 },
  });
};

export default {
  findNearby,
  findById,
  findAllPlaces,
  createPlace,
  findReviews,
  createReview,
  findExistingReview,
  updatePlaceRating,
};
