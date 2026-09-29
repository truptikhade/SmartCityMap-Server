const asyncHandler   = require('../../utils/asyncHandler')
const { successResponse } = require('../../utils/response')
const placesService  = require('./places.service')

const getNearby = asyncHandler(async (req, res) => {
 const { lat, lng, radius, category, search } = req.query
 const places = await placesService.getNearbyPlaces({ lat, lng, radius, category, search })
 return successResponse(res, 200, 'Nearby places fetched', places)
})

const getAll = asyncHandler(async (req, res) => {
 const { category, page = 1, limit = 20 } = req.query
 const result = await placesService.getAllPlaces({ category, page: +page, limit: +limit })
 return successResponse(res, 200, 'Places fetched', result)
})

const getById = asyncHandler(async (req, res) => {
 const place = await placesService.getPlaceById(req.params.id)
 return successResponse(res, 200, 'Place fetched', place)
})

const create = asyncHandler(async (req, res) => {
 const place = await placesService.createPlace(req.body)
 return successResponse(res, 201, 'Place created', place)
})

const getReviews = asyncHandler(async (req, res) => {
 const reviews = await placesService.getPlaceReviews(req.params.id)
 return successResponse(res, 200, 'Reviews fetched', reviews)
})

const addReview = asyncHandler(async (req, res) => {
 const { rating, comment } = req.body
 const review = await placesService.addReview({
   userId:  req.user.id,
   placeId: req.params.id,
   rating,
   comment,
 })
 return successResponse(res, 201, 'Review added', review)
})

module.exports = { getNearby, getAll, getById, create, getReviews, addReview }