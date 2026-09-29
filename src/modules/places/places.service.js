const AppError  = require('../../utils/AppError')
const repo      = require('./places.repository')
const { placeModel, reviewModel } = require('./places.model')

const getNearbyPlaces = async ({ lat, lng, radius, category, search }) => {
  if (!lat || !lng) throw new AppError('Latitude and longitude are required', 400)

  const places = await repo.findNearby({
    lat:      parseFloat(lat),
    lng:      parseFloat(lng),
    radius:   radius ? parseInt(radius) : 2000,
    category,
    search,
  })

  return places.map(placeModel)
}

const getPlaceById = async (id) => {
  const place = await repo.findById(id)
  if (!place) throw new AppError('Place not found', 404)
  return placeModel(place)
}

const getAllPlaces = async ({ category, page, limit }) => {
  const result = await repo.findAllPlaces({ category, page, limit })
  return {
    ...result,
    places: result.places.map(placeModel),
  }
}

const createPlace = async (data) => {
  const place = await repo.createPlace(data)
  return placeModel(place)
}

const getPlaceReviews = async (placeId) => {
  const reviews = await repo.findReviews(placeId)
  return reviews.map(reviewModel)
}

const addReview = async ({ userId, placeId, rating, comment }) => {
  // 1. Check place exists
  const place = await repo.findById(placeId)
  if (!place) throw new AppError('Place not found', 404)

  // 2. Check rating range
  if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5', 400)

  // 3. Check if already reviewed
  const existing = await repo.findExistingReview(userId, placeId)
  if (existing) throw new AppError('You have already reviewed this place', 400)

  // 4. Create review
  const review = await repo.createReview({ userId, placeId, rating, comment })

  // 5. Update place average rating
  await repo.updatePlaceRating(placeId)

  return reviewModel(review)
}

module.exports = {
  getNearbyPlaces,
  getPlaceById,
  getAllPlaces,
  createPlace,
  getPlaceReviews,
  addReview,
}