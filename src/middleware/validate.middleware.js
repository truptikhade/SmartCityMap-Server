const { errorResponse } = require('../utils/response')

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false })

    if (error) {
      const message = error.details[0].message.replace(/['"]/g, '')
      return errorResponse(res, 400, message)
    }

    next()
  }
}

module.exports = validate  // ← must be module.exports = validate, not module.exports = { validate }