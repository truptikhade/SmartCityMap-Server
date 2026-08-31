const routeModel = (route) => ({
  id:             route.id,
  routeName:      route.routeName,
  routeNumber:    route.routeNumber,
  transitType:    route.transitType,
  origin:         route.origin,
  destination:    route.destination,
  originLat:      route.originLat,
  originLng:      route.originLng,
  destinationLat: route.destinationLat,
  destinationLng: route.destinationLng,
  baseFare:       route.baseFare,
  firstDeparture: route.firstDeparture,
  lastDeparture:  route.lastDeparture,
  isActive:       route.isActive,
  stops:          route.stops  || [],
  trips:          route.trips  || [],
})

const stopModel = (stop) => ({
  id:                 stop.id,
  routeId:            stop.routeId,
  stopName:           stop.stopName,
  stopCode:           stop.stopCode,
  stopOrder:          stop.stopOrder,
  lat:                stop.lat,
  lng:                stop.lng,
  arrivalTime:        stop.arrivalTime,
  departureTime:      stop.departureTime,
  distanceFromPrevKm: stop.distanceFromPrevKm,
})

const tripModel = (trip) => ({
  id:             trip.id,
  routeId:        trip.routeId,
  vehicleNumber:  trip.vehicleNumber,
  vehicleType:    trip.vehicleType,
  driverName:     trip.driverName,
  driverPhone:    trip.driverPhone,
  departureTime:  trip.departureTime,
  arrivalTime:    trip.arrivalTime,
  travelDate:     trip.travelDate,
  status:         trip.status,
  totalSeats:     trip.totalSeats,
  availableSeats: trip.availableSeats,
})

const liveModel = (live) => ({
  id:           live.id,
  tripId:       live.tripId,
  currentLat:   live.currentLat,
  currentLng:   live.currentLng,
  delayMinutes: live.delayMinutes,
  speedKmph:    live.speedKmph,
  bearing:      live.bearing,
  updatedAt:    live.updatedAt,
  currentStop:  live.currentStop || null,
  nextStop:     live.nextStop    || null,
})

module.exports = { routeModel, stopModel, tripModel, liveModel }