const asyncHandler = require('../../utils/asyncHandler')
const { successResponse, errorResponse } = require('../../utils/response')
const authService = require('./auth.service')

const register = asyncHandler(async (req, res) => {
  const { fname, lname, email, phone, password } = req.body
  const data = await authService.register({ fname, lname, email, phone, password })
  return successResponse(res, 201, 'Registration successful', data)
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const data = await authService.login({ email, password })
  return successResponse(res, 200, 'Login successful', data)
})

const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id)
  return successResponse(res, 200, 'Profile fetched', user)
})

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body)
  return successResponse(res, 200, 'Profile updated', user)
})

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body)
  return successResponse(res, 200, result.message)
})

module.exports = { register, login, getProfile, updateProfile, changePassword }