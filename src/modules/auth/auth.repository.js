import prisma from "../../config/prisma.js";

const {
  user: _user,
  driverProfile: _driverProfile,
  vehicle: _vehicle,
  $transaction,
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
  return $transaction(async (tx) => {
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
