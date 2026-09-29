const asyncHandler = require('../../utils/asyncHandler')

const {
  successResponse,
} = require('../../utils/response')

const authService =
  require('./auth.service')

// ─────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────

const register = asyncHandler(async (req, res) => {
  const result =
    await authService.register(req.body)

  return successResponse(
    res,
    201,
    'Registration successful',
    result
  )
})

// ─────────────────────────────────────────────────────────
// REGISTER DRIVER
// ─────────────────────────────────────────────────────────

const registerDriver = asyncHandler(async (req, res) => {
  const result =
    await authService.registerDriver(req.body)

  return successResponse(
    res,
    201,
    'Driver registration successful. Your account is pending approval.',
    result
  )
})

// ─────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────

const login = asyncHandler(async (req, res) => {
  const result =
    await authService.login(req.body)

  return successResponse(
    res,
    200,
    'Login successful',
    result
  )
})

// ─────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────

const getProfile = asyncHandler(async (req, res) => {
  const result =
    await authService.getProfile(
      req.user.id
    )

  return successResponse(
    res,
    200,
    'Profile fetched successfully',
    result
  )
})

// ─────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────

const updateProfile = asyncHandler(async (req, res) => {
  const result =
    await authService.updateProfile(
      req.user.id,
      req.body
    )

  return successResponse(
    res,
    200,
    'Profile updated successfully',
    result
  )
})

// ─────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────

const changePassword = asyncHandler(async (req, res) => {
  const result =
    await authService.changePassword(
      req.user.id,
      req.body
    )

  return successResponse(
    res,
    200,
    'Password changed successfully',
    result
  )
})

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────

const forgotPassword = asyncHandler(async (req, res) => {
  const result =
    await authService.forgotPassword(
      req.body.email
    )

  return successResponse(
    res,
    200,
    result.message,
    result
  )
})

// ─────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────

const resetPassword = asyncHandler(async (req, res) => {
  const result =
    await authService.resetPassword(
      req.body
    )

  return successResponse(
    res,
    200,
    result.message,
    result
  )
})

// ─────────────────────────────────────────────────────────
// SEND / RESEND EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────

const sendVerification = asyncHandler(async (req, res) => {
  const result =
    await authService.sendVerification(
      req.user.id
    )

  return successResponse(
    res,
    200,
    result.message,
    result
  )
})

// ─────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────

const verifyEmail = asyncHandler(async (req, res) => {
  const result =
    await authService.verifyEmail(
      req.query.token
    )

  return successResponse(
    res,
    200,
    result.message,
    result
  )
})

// ─────────────────────────────────────────────────────────

module.exports = {
  register,
  registerDriver,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  sendVerification,
  verifyEmail,
}
