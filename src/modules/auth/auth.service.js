import { hash, compare } from "bcryptjs";
import jsont from "jsonwebtoken";
const { sign } = jsont;
import { randomBytes, createHash } from "crypto";
import AppError from "../../utils/AppError.js";
import authRepository from "./auth.repository.js";
const {
  findUserByEmail,
  findUserByPhone,
  createUser,
  saveEmailVerificationToken,
  clearEmailVerificationToken,
  findDriverByLicenseNumber,
  findVehicleByNumber,
  createDriver,
  updateLastLogin,
  findUserById,
  updateUser,
  deactivateUser,
  findUserByVerificationToken,
  markEmailVerified,
  savePasswordResetToken,
  clearPasswordResetToken,
  findUserByResetToken,
} = authRepository;

import model from "./auth.model.js";
const { userModel } = model;
import emailverify from "./email.service.js";
const { sendPasswordResetEmail, sendVerificationEmail } = emailverify; // assigning variable to object

//
// REGISTER NORMAL USER
//

const register = async ({ fname, lname, email, phone, password }) => {
  const existingEmail = await findUserByEmail(email);

  if (existingEmail) {
    throw new AppError("Email already registered", 400);
  }

  const existingPhone = await findUserByPhone(phone);

  if (existingPhone) {
    throw new AppError("Phone already registered", 400);
  }

  const passwordHash = await hash(password, 12);

  const user = await createUser({
    fname,
    lname,
    email,
    phone,
    passwordHash,
  });

  //
  // EMAIL VERIFICATION
  //

  const verificationToken = randomBytes(32).toString("hex");

  const hashedVerificationToken = createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  await saveEmailVerificationToken({
    userId: user.id,
    emailVerificationToken: hashedVerificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

  let verificationEmailSent = false;

  try {
    await sendVerificationEmail({
      email: user.email,
      fname: user.fname,
      verificationUrl,
    });

    verificationEmailSent = true;
  } catch (error) {
    await clearEmailVerificationToken(user.id);

    console.error("Verification email error:", error.message);
  }

  const token = generateToken(user.id);

  return {
    user: userModel(user),
    token,
    verificationEmailSent,
  };
};

//
// REGISTER DRIVER
//

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
  const existingEmail = await findUserByEmail(email);

  if (existingEmail) {
    throw new AppError("Email already registered", 400);
  }

  const existingPhone = await findUserByPhone(phone);

  if (existingPhone) {
    throw new AppError("Phone already registered", 400);
  }

  const existingLicense = await findDriverByLicenseNumber(licenseNumber);

  if (existingLicense) {
    throw new AppError("License number already registered", 400);
  }

  const existingVehicle = await findVehicleByNumber(vehicleNumber);

  if (existingVehicle) {
    throw new AppError("Vehicle number already registered", 400);
  }

  const passwordHash = await hash(password, 12);

  const result = await createDriver({
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
  });

  //
  // EMAIL VERIFICATION
  //

  const verificationToken = randomBytes(32).toString("hex");

  const hashedVerificationToken = createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  await saveEmailVerificationToken({
    userId: result.user.id,
    emailVerificationToken: hashedVerificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

  let verificationEmailSent = false;

  try {
    await sendVerificationEmail({
      email: result.user.email,
      fname: result.user.fname,
      verificationUrl,
    });

    verificationEmailSent = true;
  } catch (error) {
    await clearEmailVerificationToken(result.user.id);

    console.error("Verification email error:", error.message);
  }

  const token = generateToken(result.user.id);

  return {
    user: userModel(result.user),

    driverProfile: {
      id: result.driverProfile.id,
      licenseNumber: result.driverProfile.licenseNumber,
      isApproved: result.driverProfile.isApproved,
      isAvailable: result.driverProfile.isAvailable,
    },

    vehicle: {
      id: result.vehicle.id,
      vehicleNumber: result.vehicle.vehicleNumber,
      vehicleType: result.vehicle.vehicleType,
      brand: result.vehicle.brand,
      model: result.vehicle.model,
      color: result.vehicle.color,
      isActive: result.vehicle.isActive,
    },

    token,
    verificationEmailSent,
  };
};

//
// LOGIN
//

const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await compare(password, user.passwordHash);

  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  await updateLastLogin(user.id);

  const token = generateToken(user.id);

  return {
    user: userModel(user),
    token,
  };
};

//
// GET PROFILE
//

const getProfile = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return userModel(user);
};

//
// UPDATE PROFILE
//

const updateProfile = async (userId, updates) => {
  delete updates.passwordHash;
  delete updates.email;
  delete updates.role;
  delete updates.phone;

  const user = await updateUser(userId, updates);

  return userModel(user);
};

//
// CHANGE PASSWORD
//

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await compare(currentPassword, user.passwordHash);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  const passwordHash = await hash(newPassword, 12);

  await updateUser(userId, {
    passwordHash,
  });

  return {
    message: "Password changed successfully",
  };
};

const deleteAccount = async (userId, { currentPassword }) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 400);
  }

  const deactivated = await deactivateUser(userId);
  if (!deactivated) {
    throw new AppError(
      "Complete or cancel your active ride before deleting your account",
      409,
    );
  }

  return { message: "Account deactivated successfully" };
};

//
// SEND / RESEND EMAIL VERIFICATION
//

const sendVerification = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    return {
      message: "Email is already verified",
      alreadyVerified: true,
    };
  }

  const verificationToken = randomBytes(32).toString("hex");

  const hashedVerificationToken = createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  await saveEmailVerificationToken({
    userId: user.id,
    emailVerificationToken: hashedVerificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

  try {
    await sendVerificationEmail({
      email: user.email,
      fname: user.fname,
      verificationUrl,
    });
  } catch (error) {
    await clearEmailVerificationToken(user.id);

    console.error("Verification email error:", error.message);

    throw new AppError(
      "Unable to send verification email. Please try again later.",
      500,
    );
  }

  return {
    message: "Verification email sent successfully",
    alreadyVerified: false,
  };
};

//
// VERIFY EMAIL
//

const verifyEmail = async (verificationToken) => {
  if (!verificationToken) {
    throw new AppError("Verification token is required", 400);
  }

  const hashedToken = createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await findUserByVerificationToken(hashedToken);

  if (!user) {
    throw new AppError("Invalid or expired verification link", 400);
  }

  if (
    !user.emailVerificationExpires ||
    user.emailVerificationExpires < new Date()
  ) {
    await clearEmailVerificationToken(user.id);

    throw new AppError("Invalid or expired verification link", 400);
  }

  await markEmailVerified(user.id);

  return {
    message: "Email verified successfully",
  };
};

//
// FORGOT PASSWORD
//

const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);

  /*
   * Do not reveal whether an email
   * is registered.
   */

  if (!user) {
    return {
      message:
        "If an account exists with this email, password reset instructions have been sent.",
    };
  }

  /*
   * Generate a cryptographically secure token.
   *
   * Raw token goes into the email.
   * Only the SHA-256 hash is stored in DB.
   */

  const rawToken = randomBytes(32).toString("hex");

  const hashedToken = createHash("sha256").update(rawToken).digest("hex");

  /*
   * Token expires after 15 minutes.
   */

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await savePasswordResetToken({
    userId: user.id,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: expiresAt,
  });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      fname: user.fname,
      resetUrl,
    });
  } catch (error) {
    /*
     * Remove token if email could not be sent.
     */

    await clearPasswordResetToken(user.id);

    console.error("Password reset email error:", error.message);

    throw new AppError(
      "Unable to send password reset email. Please try again later.",
      500,
    );
  }

  return {
    message:
      "If an account exists with this email, password reset instructions have been sent.",
  };
};

//
// RESET PASSWORD
//

const resetPassword = async ({ token, newPassword }) => {
  if (!token) {
    throw new AppError("Reset token is required", 400);
  }

  const hashedToken = createHash("sha256").update(token).digest("hex");

  const user = await findUserByResetToken(hashedToken);

  if (!user) {
    throw new AppError("Invalid or expired reset link", 400);
  }

  if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    await clearPasswordResetToken(user.id);

    throw new AppError("Invalid or expired reset link", 400);
  }

  const passwordHash = await hash(newPassword, 12);

  await updateUser(user.id, {
    passwordHash,
  });

  await clearPasswordResetToken(user.id);

  return {
    message:
      "Password reset successfully. You can now log in with your new password.",
  };
};

//
// JWT
//

const generateToken = (userId) => {
  return sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

//

export default {
  register,
  registerDriver,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  sendVerification,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
