const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const AppError = require('../../utils/AppError')
const repo     = require('./auth.repository')
const { userModel } = require('./auth.model')

// ── Register ──────────────────────────────────────────────
const register = async ({ fname, lname, email, phone, password }) => {
  // 1. Check email exists
  const existingEmail = await repo.findUserByEmail(email)
  if (existingEmail) throw new AppError('Email already registered', 400)

  // 2. Check phone exists
  const existingPhone = await repo.findUserByPhone(phone)
  if (existingPhone) throw new AppError('Phone already registered', 400)

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // 4. Create user
  const user = await repo.createUser({ fname, lname, email, phone, passwordHash })

  // 5. Generate token
  const token = generateToken(user.id)

  return { user: userModel(user), token }
}

// ── Login ─────────────────────────────────────────────────
const login = async ({ email, password }) => {
  // 1. Find user
  const user = await repo.findUserByEmail(email)
  if (!user) throw new AppError('Invalid email or password', 401)

  // 2. Check password
  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) throw new AppError('Invalid email or password', 401)

  // 3. Check active
  if (!user.isActive) throw new AppError('Account is deactivated', 403)

  // 4. Update last login
  await repo.updateLastLogin(user.id)

  // 5. Generate token
  const token = generateToken(user.id)

  return { user: userModel(user), token }
}

// ── Get Profile ───────────────────────────────────────────
const getProfile = async (userId) => {
  const user = await repo.findUserById(userId)
  if (!user) throw new AppError('User not found', 404)
  return userModel(user)
}

// ── Update Profile ────────────────────────────────────────
const updateProfile = async (userId, updates) => {
  // Block sensitive fields from being updated here
  delete updates.passwordHash
  delete updates.email
  delete updates.role
  delete updates.phone

  const user = await repo.updateUser(userId, updates)
  return userModel(user)
}

// ── Change Password ───────────────────────────────────────
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await repo.findUserById(userId)
  if (!user) throw new AppError('User not found', 404)

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isMatch) throw new AppError('Current password is incorrect', 400)

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12)
  await repo.updateUser(userId, { passwordHash })

  return { message: 'Password changed successfully' }
}

// ── Helper ────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

module.exports = { register, login, getProfile, updateProfile, changePassword }