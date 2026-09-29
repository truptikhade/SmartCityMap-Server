const Joi = require('joi')

const registerSchema = Joi.object({
  fname: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min':
        'First name must be at least 2 characters',
    }),

  lname: Joi.string()
    .min(2)
    .max(50)
    .allow('', null),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email':
        'Please provide a valid email',
      'string.empty':
        'Email is required',
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Phone must be exactly 10 digits',
      'string.empty':
        'Phone is required',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min':
        'Password must be at least 6 characters',
      'string.empty':
        'Password is required',
    }),
})

const driverRegisterSchema = Joi.object({
  fname: Joi.string()
    .min(2)
    .max(50)
    .required(),

  lname: Joi.string()
    .min(2)
    .max(50)
    .allow('', null),

  email: Joi.string()
    .email()
    .required(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),

  password: Joi.string()
    .min(6)
    .required(),

  licenseNumber: Joi.string()
    .min(5)
    .max(50)
    .required(),

  vehicleNumber: Joi.string()
    .min(4)
    .max(30)
    .required(),

  vehicleType: Joi.string()
    .valid(
      'car',
      'twoWheeler',
      'auto'
    )
    .required(),

  brand: Joi.string()
    .max(50)
    .allow('', null),

  model: Joi.string()
    .max(50)
    .allow('', null),

  color: Joi.string()
    .max(30)
    .allow('', null),
})

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .required(),
})

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required(),

  newPassword: Joi.string()
    .min(6)
    .required(),
})

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email':
        'Please provide a valid email',
      'string.empty':
        'Email is required',
    }),
})

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required(),

  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min':
        'Password must be at least 6 characters',
      'string.empty':
        'New password is required',
    }),
})

module.exports = {
  registerSchema,
  driverRegisterSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
}
