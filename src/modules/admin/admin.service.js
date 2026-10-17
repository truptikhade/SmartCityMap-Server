import adminRepository from "./admin.repository.js";

import adminModelModule from "./admin.model.js";
const { driverModel } = adminModelModule;
import AppError from "../../utils/AppError.js";

const createTransitSchedule = async (schedule) => {
  if (schedule.stops.some((stop, index) => stop.stopOrder !== index + 1)) {
    throw new AppError("Stops must be ordered consecutively starting at 1", 400);
  }

  const [year, month, day] = schedule.travelDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new AppError("Enter a valid travel date", 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    throw new AppError("Travel date cannot be in the past", 400);
  }

  if (schedule.origin.toLowerCase() === schedule.destination.toLowerCase()) {
    throw new AppError("Origin and destination must be different", 400);
  }

  if (
    schedule.stops[0].stopName.toLowerCase() !==
      schedule.origin.toLowerCase() ||
    schedule.stops[schedule.stops.length - 1].stopName.toLowerCase() !==
      schedule.destination.toLowerCase()
  ) {
    throw new AppError(
      "The first and last stops must match the route origin and destination",
      400,
    );
  }

  try {
    return await adminRepository.createTransitSchedule(schedule);
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError("That route number is already in use", 409);
    }
    throw error;
  }
};

// GET ALL DRIVERS

const getAllDrivers = async () => {
  const drivers = await adminRepository.findAllDrivers();

  return drivers.map(driverModel);
};

// GET DRIVER BY ID

const getDriverById = async (driverId) => {
  const driver = await adminRepository.findDriverById(driverId);

  if (!driver) {
    throw new Error("Driver not found");
  }

  return driverModel(driver);
};

// APPROVE DRIVER

const approveDriver = async (driverId) => {
  const driver = await adminRepository.findDriverById(driverId);

  if (!driver) {
    throw new AppError("Driver not found", 404);
  }

  if (driver.user?.role !== "driver") {
    throw new AppError("Selected account is not a driver", 400);
  }

  if (driver.isApproved) {
    throw new AppError("Driver is already approved", 409);
  }

  const updatedDriver = await adminRepository.approveDriver(driverId);

  return driverModel(updatedDriver);
};

// REJECT DRIVER

const rejectDriver = async (driverId) => {
  const driver = await adminRepository.findDriverById(driverId);

  if (!driver) {
    throw new AppError("Driver not found", 404);
  }

  if (driver.user?.role !== "driver") {
    throw new AppError("Selected account is not a driver", 400);
  }

  if (!driver.isApproved) {
    throw new AppError("Driver is already pending or rejected", 409);
  }

  const updatedDriver = await adminRepository.rejectDriver(driverId);

  return driverModel(updatedDriver);
};

// GET PENDING VEHICLE CHANGE REQUESTS

const getPendingVehicleChangeRequests = async () => {
  return adminRepository.findPendingVehicleChangeRequests();
};

// APPROVE VEHICLE CHANGE REQUEST

const approveVehicleChangeRequest = async (requestId) => {
  const request = await adminRepository.findVehicleChangeRequestById(requestId);

  if (!request) {
    throw new Error("Vehicle change request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("This vehicle change request has already been reviewed");
  }

  const result = await adminRepository.approveVehicleChangeRequest(requestId);

  return result;
};

// REJECT VEHICLE CHANGE REQUEST

const rejectVehicleChangeRequest = async (requestId) => {
  const request = await adminRepository.findVehicleChangeRequestById(requestId);

  if (!request) {
    throw new Error("Vehicle change request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error("This vehicle change request has already been reviewed");
  }

  return adminRepository.rejectVehicleChangeRequest(requestId);
};

export default {
  createTransitSchedule,
  getAllDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
  getPendingVehicleChangeRequests,
  approveVehicleChangeRequest,
  rejectVehicleChangeRequest,
};
