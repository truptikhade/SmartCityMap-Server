import { randomUUID } from "node:crypto";
import AppError from "../../utils/AppError.js";
import prisma from "../../config/prisma.js";

const createTransitSchedule = async (schedule) =>
  prisma.$transaction(async (tx) => {
    const { stops, ...details } = schedule;
    let route = await tx.transitRoute.findUnique({
      where: { routeNumber: details.routeNumber },
      include: { stops: { orderBy: { stopOrder: "asc" } } },
    });

    if (route) {
      const sameRouteDetails =
        route.routeName === details.routeName &&
        route.transitType === details.transitType &&
        route.origin === details.origin &&
        route.destination === details.destination &&
        Number(route.baseFare) === Number(details.baseFare) &&
        route.stops.length === stops.length &&
        route.stops.every((existingStop, index) => {
          const requestedStop = stops[index];
          return (
            existingStop.stopName === requestedStop.stopName &&
            existingStop.stopCode === (requestedStop.stopCode || null) &&
            existingStop.stopOrder === requestedStop.stopOrder &&
            Math.abs(existingStop.lat - requestedStop.lat) < 0.000001 &&
            Math.abs(existingStop.lng - requestedStop.lng) < 0.000001 &&
            existingStop.arrivalTime === (requestedStop.arrivalTime || null) &&
            existingStop.departureTime ===
              (requestedStop.departureTime || null) &&
            Number(existingStop.distanceFromPrevKm || 0) ===
              Number(requestedStop.distanceFromPrevKm || 0)
          );
        });

      if (!sameRouteDetails) {
        throw new AppError(
          "This route number already exists with different details. Reuse the existing route details or choose another route number.",
          409,
        );
      }
    } else {
      route = await tx.transitRoute.create({
        data: {
          routeName: details.routeName,
          routeNumber: details.routeNumber,
          transitType: details.transitType,
          origin: details.origin,
          destination: details.destination,
          originLat: stops[0].lat,
          originLng: stops[0].lng,
          destinationLat: stops[stops.length - 1].lat,
          destinationLng: stops[stops.length - 1].lng,
          baseFare: details.baseFare,
          firstDeparture: details.departureTime,
          lastDeparture: details.arrivalTime || null,
          isActive: true,
        },
      });

      const createdStops = [];
      for (const stop of stops) {
        const [createdStop] = await tx.$queryRaw`
          INSERT INTO transit.transit_stops (
            id,
            route_id,
            stop_name,
            stop_code,
            stop_order,
            lat,
            lng,
            arrival_time,
            departure_time,
            distance_from_prev_km
          )
          VALUES (
            ${randomUUID()},
            ${route.id},
            ${stop.stopName},
            ${stop.stopCode || null},
            ${stop.stopOrder},
            ${stop.lat},
            ${stop.lng},
            ${stop.arrivalTime || null},
            ${stop.departureTime || null},
            ${stop.distanceFromPrevKm ?? null}
          )
          RETURNING
            id,
            route_id AS "routeId",
            stop_name AS "stopName",
            stop_code AS "stopCode",
            stop_order AS "stopOrder",
            lat,
            lng,
            arrival_time AS "arrivalTime",
            departure_time AS "departureTime",
            distance_from_prev_km AS "distanceFromPrevKm"
        `;
        createdStops.push(createdStop);
      }
      route.stops = createdStops;
    }

    const trip = await tx.trip.create({
      data: {
        routeId: route.id,
        vehicleNumber: details.vehicleNumber,
        vehicleType: details.transitType,
        driverName: details.driverName || null,
        driverPhone: details.driverPhone || null,
        departureTime: details.departureTime,
        arrivalTime: details.arrivalTime || null,
        travelDate: new Date(`${details.travelDate}T00:00:00`),
        status: "scheduled",
        totalSeats: details.totalSeats,
        availableSeats: details.totalSeats,
      },
    });

    return { route, trip };
  });

// FIND ALL DRIVERS

const findAllDrivers = async () => {
  return prisma.driverProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
      },

      vehicles: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
          isActive: true,
          approvalStatus: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

// FIND DRIVER BY ID

const findDriverById = async (driverId) => {
  return prisma.driverProfile.findUnique({
    where: {
      id: driverId,
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
      },

      vehicles: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
          isActive: true,
          approvalStatus: true,
        },
      },
    },
  });
};

// APPROVE DRIVER

const approveDriver = async (driverId) => {
  return prisma.driverProfile.update({
    where: {
      id: driverId,
    },

    data: {
      isApproved: true,
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },

      vehicles: true,
    },
  });
};

// REJECT DRIVER

const rejectDriver = async (driverId) => {
  return prisma.driverProfile.update({
    where: {
      id: driverId,
    },

    data: {
      isApproved: false,
      isAvailable: false,
    },

    include: {
      user: {
        select: {
          id: true,
          fname: true,
          lname: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
        },
      },

      vehicles: true,
    },
  });
};

// FIND PENDING VEHICLE CHANGE REQUESTS

const findPendingVehicleChangeRequests = async () => {
  return prisma.vehicleChangeRequest.findMany({
    where: {
      status: "PENDING",
    },

    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              fname: true,
              lname: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      },

      vehicle: {
        select: {
          id: true,
          vehicleNumber: true,
          vehicleType: true,
          brand: true,
          model: true,
          color: true,
          isActive: true,
        },
      },
    },

    orderBy: {
      requestedAt: "asc",
    },
  });
};

// FIND VEHICLE CHANGE REQUEST

const findVehicleChangeRequestById = async (requestId) => {
  return prisma.vehicleChangeRequest.findUnique({
    where: {
      id: requestId,
    },

    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              fname: true,
              lname: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      },

      vehicle: true,
    },
  });
};

// APPROVE VEHICLE CHANGE REQUEST

const approveVehicleChangeRequest = async (requestId) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.vehicleChangeRequest.findUnique({
      where: {
        id: requestId,
      },

      include: {
        vehicle: true,
      },
    });

    if (!request) {
      return null;
    }

    if (request.status !== "PENDING") {
      throw new Error("This vehicle change request has already been reviewed");
    }

    // Make sure another vehicle does not already
    // use the requested vehicle number.
    const existingVehicle = await tx.vehicle.findUnique({
      where: {
        vehicleNumber: request.vehicleNumber,
      },
    });

    if (existingVehicle && existingVehicle.id !== request.vehicleId) {
      throw new Error("The requested vehicle number is already registered");
    }

    // Update the existing vehicle.
    const updatedVehicle = await tx.vehicle.update({
      where: {
        id: request.vehicleId,
      },

      data: {
        vehicleNumber: request.vehicleNumber,

        vehicleType: request.vehicleType,

        brand: request.brand,

        model: request.model,

        color: request.color,

        isActive: true,

        approvalStatus: "APPROVED",

        approvedAt: new Date(),

        rejectedAt: null,

        requestedAt: null,
      },
    });

    // Mark request approved.
    const updatedRequest = await tx.vehicleChangeRequest.update({
      where: {
        id: requestId,
      },

      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
      },

      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                fname: true,
                lname: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },

        vehicle: true,
      },
    });

    return {
      request: updatedRequest,
      vehicle: updatedVehicle,
    };
  });
};

// REJECT VEHICLE CHANGE REQUEST

const rejectVehicleChangeRequest = async (requestId) => {
  return prisma.$transaction(async (tx) => {
    const request = await tx.vehicleChangeRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!request) {
      return null;
    }

    if (request.status !== "PENDING") {
      throw new Error("This vehicle change request has already been reviewed");
    }

    // IMPORTANT:
    // The actual vehicle is NOT modified.
    const updatedRequest = await tx.vehicleChangeRequest.update({
      where: {
        id: requestId,
      },

      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
      },

      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                fname: true,
                lname: true,
                email: true,
                phone: true,
                role: true,
              },
            },
          },
        },

        vehicle: true,
      },
    });

    return updatedRequest;
  });
};

export default {
  createTransitSchedule,
  findAllDrivers,
  findDriverById,
  approveDriver,
  rejectDriver,
  findPendingVehicleChangeRequests,
  findVehicleChangeRequestById,
  approveVehicleChangeRequest,
  rejectVehicleChangeRequest,
};
