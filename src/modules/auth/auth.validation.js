const Joi = require('joi')

const registerSchema = Joi.object({
  fname:    Joi.string().min(2).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.min':   'First name must be at least 2 characters',
  }),
  lname:    Joi.string().min(2).max(50).allow('', null),
  email:    Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email',
    'string.empty': 'Email is required',
  }),
  phone:    Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Phone must be exactly 10 digits',
    'string.empty':        'Phone is required',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min':   'Password must be at least 6 characters',
    'string.empty': 'Password is required',
  }),
})

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
})

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(6).required(),
})

module.exports = { registerSchema, loginSchema, changePasswordSchema }