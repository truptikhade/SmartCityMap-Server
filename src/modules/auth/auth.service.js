const bcrypt = require('bcryptjs')

const jwt = require('jsonwebtoken')

const crypto = require('crypto')

const AppError = require('../../utils/AppError')

const repo = require('./auth.repository')

const { userModel } = require('./auth.model')

const {
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require('./email.service')

// ─────────────────────────────────────────────────────────
// REGISTER NORMAL USER
// ─────────────────────────────────────────────────────────

const register = async ({
  fname,
  lname,
  email,
  phone,
  password,
}) => {
  const existingEmail =
    await repo.findUserByEmail(email)

  if (existingEmail) {
    throw new AppError(
      'Email already registered',
      400
    )
  }

  const existingPhone =
    await repo.findUserByPhone(phone)

  if (existingPhone) {
    throw new AppError(
      'Phone already registered',
      400
    )
  }

  const passwordHash =
    await bcrypt.hash(password, 12)

  const user =
    await repo.createUser({
      fname,
      lname,
      email,
      phone,
      passwordHash,
    })

  // ───────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ───────────────────────────────────────────────────────

  const verificationToken =
    crypto.randomBytes(32).toString('hex')

  const hashedVerificationToken =
    crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

  const verificationExpires =
    new Date(
      Date.now() + 15 * 60 * 1000
    )

  await repo.saveEmailVerificationToken({
    userId: user.id,
    emailVerificationToken:
      hashedVerificationToken,
    emailVerificationExpires:
      verificationExpires,
  })

  const clientUrl =
    process.env.CLIENT_URL ||
    'http://localhost:3000'

  const verificationUrl =
    `${clientUrl}/verify-email?token=${verificationToken}`

  let verificationEmailSent = false

  try {
    await sendVerificationEmail({
      email: user.email,
      fname: user.fname,
      verificationUrl,
    })

    verificationEmailSent = true
  } catch (error) {
    await repo.clearEmailVerificationToken(
      user.id
    )

    console.error(
      'Verification email error:',
      error.message
    )
  }

  const token =
    generateToken(user.id)

  return {
    user: userModel(user),
    token,
    verificationEmailSent,
  }
}

// ─────────────────────────────────────────────────────────
// REGISTER DRIVER
// ─────────────────────────────────────────────────────────

const registerDriver = async ({
  fname,
  lname,
  email,
  phone,
  password,
  licenseNumber,
  vehicleNumber,
  vehicleType,
  brand,
  model,
  color,
}) => {
  const existingEmail =
    await repo.findUserByEmail(email)

  if (existingEmail) {
    throw new AppError(
      'Email already registered',
      400
    )
  }

  const existingPhone =
    await repo.findUserByPhone(phone)

  if (existingPhone) {
    throw new AppError(
      'Phone already registered',
      400
    )
  }

  const existingLicense =
    await repo.findDriverByLicenseNumber(
      licenseNumber
    )

  if (existingLicense) {
    throw new AppError(
      'License number already registered',
      400
    )
  }

  const existingVehicle =
    await repo.findVehicleByNumber(
      vehicleNumber
    )

  if (existingVehicle) {
    throw new AppError(
      'Vehicle number already registered',
      400
    )
  }

  const passwordHash =
    await bcrypt.hash(password, 12)

  const result =
    await repo.createDriver({
      fname,
      lname,
      email,
      phone,
      passwordHash,
      licenseNumber,
      vehicleNumber,
      vehicleType,
      brand,
      model,
      color,
    })

  // ───────────────────────────────────────────────────────
  // EMAIL VERIFICATION
  // ───────────────────────────────────────────────────────

  const verificationToken =
    crypto.randomBytes(32).toString('hex')

  const hashedVerificationToken =
    crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

  const verificationExpires =
    new Date(
      Date.now() + 15 * 60 * 1000
    )

  await repo.saveEmailVerificationToken({
    userId: result.user.id,
    emailVerificationToken:
      hashedVerificationToken,
    emailVerificationExpires:
      verificationExpires,
  })

  const clientUrl =
    process.env.CLIENT_URL ||
    'http://localhost:3000'

  const verificationUrl =
    `${clientUrl}/verify-email?token=${verificationToken}`

  let verificationEmailSent = false

  try {
    await sendVerificationEmail({
      email: result.user.email,
      fname: result.user.fname,
      verificationUrl,
    })

    verificationEmailSent = true
  } catch (error) {
    await repo.clearEmailVerificationToken(
      result.user.id
    )

    console.error(
      'Verification email error:',
      error.message
    )
  }

  const token =
    generateToken(result.user.id)

  return {
    user: userModel(result.user),

    driverProfile: {
      id: result.driverProfile.id,
      licenseNumber:
        result.driverProfile.licenseNumber,
      isApproved:
        result.driverProfile.isApproved,
      isAvailable:
        result.driverProfile.isAvailable,
    },

    vehicle: {
      id: result.vehicle.id,
      vehicleNumber:
        result.vehicle.vehicleNumber,
      vehicleType:
        result.vehicle.vehicleType,
      brand:
        result.vehicle.brand,
      model:
        result.vehicle.model,
      color:
        result.vehicle.color,
      isActive:
        result.vehicle.isActive,
    },

    token,
    verificationEmailSent,
  }
}

// ─────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────

const login = async ({
  email,
  password,
}) => {
  const user =
    await repo.findUserByEmail(email)

  if (!user) {
    throw new AppError(
      'Invalid email or password',
      401
    )
  }

  const isMatch =
    await bcrypt.compare(
      password,
      user.passwordHash
    )

  if (!isMatch) {
    throw new AppError(
      'Invalid email or password',
      401
    )
  }

  if (!user.isActive) {
    throw new AppError(
      'Account is deactivated',
      403
    )
  }

  await repo.updateLastLogin(user.id)

  const token =
    generateToken(user.id)

  return {
    user: userModel(user),
    token,
  }
}

// ─────────────────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────────────────

const getProfile = async (userId) => {
  const user =
    await repo.findUserById(userId)

  if (!user) {
    throw new AppError(
      'User not found',
      404
    )
  }

  return userModel(user)
}

// ─────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────

const updateProfile = async (
  userId,
  updates
) => {
  delete updates.passwordHash
  delete updates.email
  delete updates.role
  delete updates.phone

  const user =
    await repo.updateUser(
      userId,
      updates
    )

  return userModel(user)
}

// ─────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────

const changePassword = async (
  userId,
  {
    currentPassword,
    newPassword,
  }
) => {
  const user =
    await repo.findUserById(userId)

  if (!user) {
    throw new AppError(
      'User not found',
      404
    )
  }

  const isMatch =
    await bcrypt.compare(
      currentPassword,
      user.passwordHash
    )

  if (!isMatch) {
    throw new AppError(
      'Current password is incorrect',
      400
    )
  }

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12
    )

  await repo.updateUser(
    userId,
    {
      passwordHash,
    }
  )

  return {
    message:
      'Password changed successfully',
  }
}

// ─────────────────────────────────────────────────────────
// SEND / RESEND EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────

const sendVerification = async (
  userId
) => {
  const user =
    await repo.findUserById(userId)

  if (!user) {
    throw new AppError(
      'User not found',
      404
    )
  }

  if (user.isVerified) {
    return {
      message:
        'Email is already verified',
      alreadyVerified: true,
    }
  }

  const verificationToken =
    crypto.randomBytes(32).toString('hex')

  const hashedVerificationToken =
    crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

  const verificationExpires =
    new Date(
      Date.now() + 15 * 60 * 1000
    )

  await repo.saveEmailVerificationToken({
    userId: user.id,
    emailVerificationToken:
      hashedVerificationToken,
    emailVerificationExpires:
      verificationExpires,
  })

  const clientUrl =
    process.env.CLIENT_URL ||
    'http://localhost:3000'

  const verificationUrl =
    `${clientUrl}/verify-email?token=${verificationToken}`

  try {
    await sendVerificationEmail({
      email: user.email,
      fname: user.fname,
      verificationUrl,
    })
  } catch (error) {
    await repo.clearEmailVerificationToken(
      user.id
    )

    console.error(
      'Verification email error:',
      error.message
    )

    throw new AppError(
      'Unable to send verification email. Please try again later.',
      500
    )
  }

  return {
    message:
      'Verification email sent successfully',
    alreadyVerified: false,
  }
}

// ─────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────

const verifyEmail = async (
  verificationToken
) => {
  if (!verificationToken) {
    throw new AppError(
      'Verification token is required',
      400
    )
  }

  const hashedToken =
    crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

  const user =
    await repo.findUserByVerificationToken(
      hashedToken
    )

  if (!user) {
    throw new AppError(
      'Invalid or expired verification link',
      400
    )
  }

  if (
    !user.emailVerificationExpires ||
    user.emailVerificationExpires <
      new Date()
  ) {
    await repo.clearEmailVerificationToken(
      user.id
    )

    throw new AppError(
      'Invalid or expired verification link',
      400
    )
  }

  await repo.markEmailVerified(
    user.id
  )

  return {
    message:
      'Email verified successfully',
  }
}

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────

const forgotPassword = async (email) => {
  const user =
    await repo.findUserByEmail(email)

  /*
   * Do not reveal whether an email
   * is registered.
   */

  if (!user) {
    return {
      message:
        'If an account exists with this email, password reset instructions have been sent.',
    }
  }

  /*
   * Generate a cryptographically secure token.
   *
   * Raw token goes into the email.
   * Only the SHA-256 hash is stored in DB.
   */

  const rawToken =
    crypto.randomBytes(32).toString('hex')

  const hashedToken =
    crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

  /*
   * Token expires after 15 minutes.
   */

  const expiresAt =
    new Date(
      Date.now() + 15 * 60 * 1000
    )

  await repo.savePasswordResetToken({
    userId: user.id,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: expiresAt,
  })

  const clientUrl =
    process.env.CLIENT_URL ||
    'http://localhost:3000'

  const resetUrl =
    `${clientUrl}/reset-password?token=${rawToken}`

  try {
    await sendPasswordResetEmail({
      email: user.email,
      fname: user.fname,
      resetUrl,
    })
  } catch (error) {
    /*
     * Remove token if email could not be sent.
     */

    await repo.clearPasswordResetToken(
      user.id
    )

    console.error(
      'Password reset email error:',
      error.message
    )

    throw new AppError(
      'Unable to send password reset email. Please try again later.',
      500
    )
  }

  return {
    message:
      'If an account exists with this email, password reset instructions have been sent.',
  }
}

// ─────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────

const resetPassword = async ({
  token,
  newPassword,
}) => {
  if (!token) {
    throw new AppError(
      'Reset token is required',
      400
    )
  }

  const hashedToken =
    crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

  const user =
    await repo.findUserByResetToken(
      hashedToken
    )

  if (!user) {
    throw new AppError(
      'Invalid or expired reset link',
      400
    )
  }

  if (
    !user.resetPasswordExpires ||
    user.resetPasswordExpires < new Date()
  ) {
    await repo.clearPasswordResetToken(
      user.id
    )

    throw new AppError(
      'Invalid or expired reset link',
      400
    )
  }

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12
    )

  await repo.updateUser(
    user.id,
    {
      passwordHash,
    }
  )

  await repo.clearPasswordResetToken(
    user.id
  )

  return {
    message:
      'Password reset successfully. You can now log in with your new password.',
  }
}

// ─────────────────────────────────────────────────────────
// JWT
// ─────────────────────────────────────────────────────────

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d',
    }
  )
}

// ─────────────────────────────────────────────────────────

module.exports = {
  register,
  registerDriver,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
}
