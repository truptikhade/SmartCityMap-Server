const jwt = require('jsonwebtoken')
const { errorResponse } = require('../utils/response')

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'No token provided. Please login.')
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return errorResponse(res, 401, 'Invalid or expired token. Please login again.')
  }
}

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'You do not have permission to perform this action')
    }
    next()
  }
}

module.exports = { protect, restrictTo }