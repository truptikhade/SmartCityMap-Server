const asyncHandler = require('../../utils/asyncHandler')
const { successResponse } = require('../../utils/response')
const aiService = require('./ai.service')

const getRecommendations = asyncHandler(
  async (req, res) => {
    const {
      lat,
      lng,
      message,
    } = req.query

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          'message is required',
      })
    }

    const data =
      await aiService.getNearbyRecommendations({
        lat: lat
          ? parseFloat(lat)
          : null,

        lng: lng
          ? parseFloat(lng)
          : null,

        message,
      })

    return successResponse(
      res,
      200,
      'AI recommendations fetched',
      data
    )
  }
)

const getSpecialties =
  asyncHandler(
    async (req, res) => {
      const data =
        await aiService.getPlaceSpecialties(
          req.params.placeId
        )

      return successResponse(
        res,
        200,
        'Place specialties fetched',
        data
      )
    }
  )

module.exports = {
  getRecommendations,
  getSpecialties,
}