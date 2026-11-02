import prisma from "../config/prisma.js";
import transitRepository from "../modules/transit/transit.repository.js";
import tripSimulator from "./trip.simulator.js";

const { startTripSimulator, getActiveSimulators } = tripSimulator;

const timeToMinutes = (time) => {
  const match = String(time || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const startDueTripSimulators = async (io) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        travelDate: {
          gte: today,
          lte: endOfDay,
        },
        status: {
          in: ["scheduled", "running"],
        },
      },
    });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const activeTripIds = new Set(getActiveSimulators());

    let started = 0;

    for (const trip of trips) {
      const departureMinutes = timeToMinutes(trip.departureTime);
      const arrivalMinutes = timeToMinutes(trip.arrivalTime);

      if (departureMinutes === null) continue;

      if (
        trip.status === "scheduled" &&
        arrivalMinutes !== null &&
        arrivalMinutes >= departureMinutes &&
        currentMinutes > arrivalMinutes
      ) {
        await transitRepository.updateTripStatus(trip.id, "completed");

        continue;
      }

      const isInServiceWindow =
        currentMinutes >= departureMinutes &&
        (arrivalMinutes === null ||
          arrivalMinutes < departureMinutes ||
          currentMinutes <= arrivalMinutes);

      if (!isInServiceWindow || activeTripIds.has(trip.id)) {
        continue;
      }

      const stops = await transitRepository.findStopsByRoute(trip.routeId);

      startTripSimulator(io, {
        tripId: trip.id,
        routeId: trip.routeId,
        stops,
        ...trip,
      });

      started += 1;
    }

    if (started > 0) {
      console.log(`Started ${started} scheduled transit simulator(s)`);
    }
  } catch (err) {
    console.error("Transit simulator scheduler error:", err.message);
  }
};

export { startDueTripSimulators };
