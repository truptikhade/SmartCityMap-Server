const { upsertLiveTracking } = require('../modules/transit/transit.repository')

const activeTripSimulators = new Map()

const startTripSimulator = (io, { tripId, routeId, stops, vehicleNumber }) => {
  if (activeTripSimulators.has(tripId)) {
    console.log(`Simulator already running for trip ${tripId}`)
    return
  }

  if (!stops || stops.length < 2) {
    console.log(`Simulator: not enough stops for trip ${tripId}`)
    return
  }

  let currentStopIndex = 0
  let progress         = 0  // 0.0 → 1.0 between two stops

  console.log(`🚌 Simulator started: trip ${tripId} | route ${routeId} | ${stops.length} stops`)

  const interval = setInterval(async () => {
    const fromStop = stops[currentStopIndex]
    const toStop   = stops[currentStopIndex + 1]

    // Reached final stop
    if (!toStop) {
      console.log(`🏁 Trip ${tripId} completed all stops`)
      clearInterval(interval)
      activeTripSimulators.delete(tripId)
      return
    }

    // Advance progress
    progress += 0.05
    if (progress >= 1) {
      progress = 0
      currentStopIndex++
      console.log(`🚏 Trip ${tripId} → stop ${currentStopIndex + 1}/${stops.length}: ${stops[currentStopIndex]?.stopName || 'done'}`)
    }

    // Interpolate GPS position between two stops
    const lat = fromStop.lat + (toStop.lat - fromStop.lat) * progress
    const lng = fromStop.lng + (toStop.lng - fromStop.lng) * progress

    // Bearing (direction angle 0–360)
    const dLng    = toStop.lng - fromStop.lng
    const dLat    = toStop.lat - fromStop.lat
    const bearing = (Math.atan2(dLng, dLat) * (180 / Math.PI) + 360) % 360

    // Simulated speed with slight variation
    const speedKmph = Math.round(40 + Math.random() * 20)

    try {
      // 1. Save to DB
      await upsertLiveTracking({
        tripId,
        currentLat:    lat,
        currentLng:    lng,
        currentStopId: fromStop.id,
        nextStopId:    toStop.id,
        speedKmph,
        bearing:       Math.round(bearing),
        delayMinutes:  0,
      })

      // 2. Broadcast to all clients watching this route
      // Note: emit directly via io (bypasses driver role check in tracking.socket.js)
      io.to(`route:${routeId}`).emit('vehicle:location', {
        routeId,
        tripId,
        vehicleNumber,
        lat,
        lng,
        speedKmph,
        bearing:     Math.round(bearing),
        currentStop: fromStop.stopName,
        nextStop:    toStop.stopName,
        updatedAt:   new Date().toISOString(),
      })

    } catch (err) {
      console.error(`Simulator error for trip ${tripId}:`, err.message)
    }

  }, 3000) // emit every 3 seconds

  activeTripSimulators.set(tripId, interval)
}

const stopTripSimulator = (tripId) => {
  const interval = activeTripSimulators.get(tripId)
  if (interval) {
    clearInterval(interval)
    activeTripSimulators.delete(tripId)
    console.log(`🛑 Simulator stopped: trip ${tripId}`)
  }
}

const getActiveSimulators = () => [...activeTripSimulators.keys()]

module.exports = { startTripSimulator, stopTripSimulator, getActiveSimulators }