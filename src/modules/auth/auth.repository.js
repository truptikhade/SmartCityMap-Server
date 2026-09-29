const prisma = require('../../config/prisma')

// ─────────────────────────────────────────────────────────
// USER QUERIES
// ─────────────────────────────────────────────────────────

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: {
      email,
    },
  })
}

const findUserByPhone = async (phone) => {
  return prisma.user.findUnique({
    where: {
      phone,
    },
  })
}

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: {
      id,
    },
  })
}

// ─────────────────────────────────────────────────────────
// USER CREATION
// ─────────────────────────────────────────────────────────

const createUser = async ({
  fname,
  lname,
  email,
  phone,
  passwordHash,
}) => {
  return prisma.user.create({
    data: {
      fname,
      lname,
      email,
      phone,
      passwordHash,
    },
  })
}

// ─────────────────────────────────────────────────────────
// DRIVER REGISTRATION
// ─────────────────────────────────────────────────────────

const findDriverByLicenseNumber = async (licenseNumber) => {
  return prisma.driverProfile.findUnique({
    where: {
      licenseNumber,
    },
  })
}

const findVehicleByNumber = async (vehicleNumber) => {
  return prisma.vehicle.findUnique({
    where: {
      vehicleNumber,
    },
  })
}

const createDriver = async ({
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
}) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        fname,
        lname,
        email,
        phone,
        passwordHash,
        role: 'driver',
      },
    })

    const driverProfile = await tx.driverProfile.create({
      data: {
        userId: user.id,
        licenseNumber,
        isApproved: false,
        isAvailable: false,
      },
    })

    const vehicle = await tx.vehicle.create({
      data: {
        driverId: driverProfile.id,
        vehicleNumber,
        vehicleType,
        brand,
        model,
        color,
        isActive: true,
      },
    })

    return {
      user,
      driverProfile,
      vehicle,
    }
  })
}

// ─────────────────────────────────────────────────────────
// USER UPDATE
// ─────────────────────────────────────────────────────────

const updateUser = async (id, data) => {
  return prisma.user.update({
    where: {
      id,
    },
    data,
  })
}

const updateLastLogin = async (id) => {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      lastLogin: new Date(),
    },
  })
}

// ─────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────

const saveEmailVerificationToken = async ({
  userId,
  emailVerificationToken,
  emailVerificationExpires,
}) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerificationToken,
      emailVerificationExpires,
    },
  })
}

const findUserByVerificationToken = async (
  emailVerificationToken
) => {
  return prisma.user.findFirst({
    where: {
      emailVerificationToken,
    },
  })
}

const clearEmailVerificationToken = async (userId) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  })
}

const markEmailVerified = async (userId) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  })
}

// ─────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────

const savePasswordResetToken = async ({
  userId,
  resetPasswordToken,
  resetPasswordExpires,
}) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      resetPasswordToken,
      resetPasswordExpires,
    },
  })
}

const findUserByResetToken = async (resetPasswordToken) => {
  return prisma.user.findFirst({
    where: {
      resetPasswordToken,
    },
  })
}

const clearPasswordResetToken = async (userId) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  })
}

// ─────────────────────────────────────────────────────────

module.exports = {
  findUserByEmail,
  findUserByPhone,
  findUserById,

  createUser,

  findDriverByLicenseNumber,
  findVehicleByNumber,
  createDriver,

  updateUser,
  updateLastLogin,

  // Email verification
  saveEmailVerificationToken,
  findUserByVerificationToken,
  clearEmailVerificationToken,
  markEmailVerified,

  // Password reset
  savePasswordResetToken,
  findUserByResetToken,
  clearPasswordResetToken,
}