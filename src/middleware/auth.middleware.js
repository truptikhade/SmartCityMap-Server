const jwt = require('jsonwebtoken')
const { errorResponse } = require('../utils/response')
const prisma = require('../config/prisma')

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'No token provided. Please login.')
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    })

    if (!user) {
      return errorResponse(res, 401, 'User account not found.')
    }

    if (!user.isActive) {
      return errorResponse(res, 403, 'Your account is deactivated.')
    }

    req.user = user

    next()
  } catch (err) {
    return errorResponse(
      res,
      401,
      'Invalid or expired token. Please login again.'
    )
  }
}

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        401,
        'Authentication required.'
      )
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        'You do not have permission to perform this action'
      )
    }

    next()
  }
}

module.exports = {
  protect,
  restrictTo,
}
