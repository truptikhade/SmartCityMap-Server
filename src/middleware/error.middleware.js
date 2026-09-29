const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', err.message)

  const statusCode = err.statusCode || 500
  const message    = err.message    || 'Internal Server Error'

  // PostgreSQL errors
  if (err.code === 'P2002') {          // Prisma unique violation
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry — record already exists',
    })
  }

  if (err.code === 'P2025') {          // Prisma record not found
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired, please login again',
    })
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })
}

module.exports = errorHandler