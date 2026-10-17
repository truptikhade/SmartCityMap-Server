import transitRepository from "../modules/transit/transit.repository.js";
const { upsertLiveTracking, updateTripStatus } = transitRepository;

const activeTripSimulators = new Map();
const UPDATE_INTERVAL_MS = 5000;

const timeToMinutes = (time) => {
  const match = String(time || "").match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const distanceKm = (from, to) => {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const startTripSimulator = (
  io,
  { tripId, routeId, stops, vehicleNumber, travelDate, departureTime, arrivalTime },
) => {
  if (activeTripSimulators.has(tripId)) return;
  if (!stops || stops.length < 2) {
    console.error(`Simulator: not enough stops for trip ${tripId}`);
    return;
  }

  const routeStops = [...stops]
    .sort((a, b) => a.stopOrder - b.stopOrder)
    .map((stop) => ({
      ...stop,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
    }));

  const segments = routeStops.slice(1).map((stop, index) => ({
    from: routeStops[index],
    to: stop,
    distanceKm: distanceKm(routeStops[index], stop),
  }));
  const totalDistanceKm = segments.reduce(
    (total, segment) => total + segment.distanceKm,
    0,
  );
  const departureMinutes = timeToMinutes(departureTime);
  const arrivalMinutes = timeToMinutes(arrivalTime);
  const serviceDate = new Date(travelDate);
  const startAt = new Date(serviceDate);
  if (departureMinutes !== null) {
    startAt.setHours(
      Math.floor(departureMinutes / 60),
      departureMinutes % 60,
      0,
      0,
    );
  }

  const scheduledDurationMinutes =
    departureMinutes !== null &&
    arrivalMinutes !== null &&
    arrivalMinutes > departureMinutes
      ? arrivalMinutes - departureMinutes
      : null;
  const durationMs =
    (scheduledDurationMinutes ??
      Math.max(15, Math.round((totalDistanceKm / 35) * 60))) *
    60_000;

  console.log(
    `Simulated transit started: trip ${tripId} | route ${routeId} | ${routeStops.length} stops`,
  );
  updateTripStatus(tripId, "running").catch((error) => {
    console.error(`Could not mark trip ${tripId} as running:`, error.message);
  });

  const interval = setInterval(async () => {
    const elapsedMs = Math.max(0, Date.now() - startAt.getTime());
    const progress = Math.min(1, elapsedMs / durationMs);
    const targetDistanceKm = totalDistanceKm * progress;
    let passedDistanceKm = 0;
    let segment = segments[segments.length - 1];
    let segmentProgress = 1;

    for (const candidate of segments) {
      const segmentEndKm = passedDistanceKm + candidate.distanceKm;
      if (targetDistanceKm <= segmentEndKm) {
        segment = candidate;
        segmentProgress =
          candidate.distanceKm === 0
            ? 1
            : (targetDistanceKm - passedDistanceKm) / candidate.distanceKm;
        break;
      }
      passedDistanceKm = segmentEndKm;
    }

    const isComplete = progress >= 1;
    const lat =
      segment.from.lat + (segment.to.lat - segment.from.lat) * segmentProgress;
    const lng =
      segment.from.lng + (segment.to.lng - segment.from.lng) * segmentProgress;
    const currentStop = isComplete ? routeStops.at(-1) : segment.from;
    const nextStop = isComplete ? null : segment.to;
    const speedKmph = isComplete
      ? 0
      : Number((totalDistanceKm / (durationMs / 3_600_000)).toFixed(1));
    const bearing = isComplete
      ? 0
      : (Math.atan2(
          segment.to.lng - segment.from.lng,
          segment.to.lat - segment.from.lat,
        ) *
          180) /
          Math.PI;

    try {
      await upsertLiveTracking({
        tripId,
        currentLat: lat,
        currentLng: lng,
        currentStopId: currentStop.id,
        nextStopId: nextStop?.id || null,
        speedKmph,
        bearing: (bearing + 360) % 360,
        delayMinutes: 0,
      });

      io.to(`route:${routeId}`).emit("vehicle:location", {
        routeId,
        tripId,
        vehicleNumber,
        lat,
        lng,
        speedKmph,
        bearing: (bearing + 360) % 360,
        trackingSource: "simulated",
        currentStop: currentStop.stopName,
        nextStop: nextStop?.stopName || null,
        updatedAt: new Date().toISOString(),
      });

      if (isComplete) {
        clearInterval(interval);
        activeTripSimulators.delete(tripId);
        await updateTripStatus(tripId, "completed");
        console.log(`Simulated trip ${tripId} completed`);
      }
    } catch (error) {
      console.error(`Simulator error for trip ${tripId}:`, error.message);
    }
  }, UPDATE_INTERVAL_MS);

  activeTripSimulators.set(tripId, interval);
};

const stopTripSimulator = (tripId) => {
  const interval = activeTripSimulators.get(tripId);
  if (!interval) return;
  clearInterval(interval);
  activeTripSimulators.delete(tripId);
};

const getActiveSimulators = () => [...activeTripSimulators.keys()];

export default { startTripSimulator, stopTripSimulator, getActiveSimulators };
