import prisma from "../../config/prisma.js";

const {
  user: _user,
  driverProfile: _driverProfile,
  vehicle: _vehicle,
} = prisma;

//
// USER QUERIES
//

const findUserByEmail = async (email) => {
  return _user.findUnique({
    where: {
      email,
    },
  });
};

const findUserByPhone = async (phone) => {
  return _user.findUnique({
    where: {
      phone,
    },
  });
};

const findUserById = async (id) => {
  return _user.findUnique({
    where: {
      id,
    },
  });
};

//
// USER CREATION
//

const createUser = async ({ fname, lname, email, phone, passwordHash }) => {
  return _user.create({
    data: {
      fname,
      lname,
      email,
      phone,
      passwordHash,
    },
  });
};

//
// DRIVER REGISTRATION
//

const findDriverByLicenseNumber = async (licenseNumber) => {
  return _driverProfile.findUnique({
    where: {
      licenseNumber,
    },
  });
};

const findVehicleByNumber = async (vehicleNumber) => {
  return _vehicle.findUnique({
    where: {
      vehicleNumber,
    },
  });
};

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
        role: "driver",
      },
    });

    const driverProfile = await tx.driverProfile.create({
      data: {
        userId: user.id,
        licenseNumber,
        isApproved: false,
        isAvailable: false,
      },
    });

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
    });

    return {
      user,
      driverProfile,
      vehicle,
    };
  });
};

//
// USER UPDATE
//

const updateUser = async (id, data) => {
  return _user.update({
    where: {
      id,
    },
    data,
  });
};

const deactivateUser = async (userId) =>
  prisma.$transaction(async (tx) => {
    const activeRide = await tx.rideRequest.findFirst({
      where: {
        OR: [{ passengerId: userId }, { driverId: userId }],
        status: {
          in: [
            "REQUESTED",
            "DRIVER_ARRIVING",
            "DRIVER_ARRIVED",
            "OTP_VERIFIED",
            "IN_PROGRESS",
          ],
        },
      },
      select: { id: true },
    });

    if (activeRide) return false;

    await tx.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await tx.driverProfile.updateMany({
      where: { userId },
      data: { isAvailable: false },
    });

    return true;
  });

const updateLastLogin = async (id) => {
  return _user.update({
    where: {
      id,
    },
    data: {
      lastLogin: new Date(),
    },
  });
};

//
// EMAIL VERIFICATION
//

const saveEmailVerificationToken = async ({
  userId,
  emailVerificationToken,
  emailVerificationExpires,
}) => {
  return _user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerificationToken,
      emailVerificationExpires,
    },
  });
};

const findUserByVerificationToken = async (emailVerificationToken) => {
  return _user.findFirst({
    where: {
      emailVerificationToken,
    },
  });
};

const clearEmailVerificationToken = async (userId) => {
  return _user.update({
    where: {
      id: userId,
    },
    data: {
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });
};

const markEmailVerified = async (userId) => {
  return _user.update({
    where: {
      id: userId,
    },
    data: {
      isVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });
};

//
// PASSWORD RESET
//

const savePasswordResetToken = async ({
  userId,
  resetPasswordToken,
  resetPasswordExpires,
}) => {
  return _user.update({
    where: {
      id: userId,
    },
    data: {
      resetPasswordToken,
      resetPasswordExpires,
    },
  });
};

const findUserByResetToken = async (resetPasswordToken) => {
  return _user.findFirst({
    where: {
      resetPasswordToken,
    },
  });
};

const clearPasswordResetToken = async (userId) => {
  return _user.update({
    where: {
      id: userId,
    },
    data: {
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
};

//

export default {
  findUserByEmail,
  findUserByPhone,
  findUserById,

  createUser,

  findDriverByLicenseNumber,
  findVehicleByNumber,
  createDriver,

  updateUser,
  deactivateUser,
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
};
