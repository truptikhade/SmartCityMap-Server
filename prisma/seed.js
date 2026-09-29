require('dotenv/config')

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
})

function todayStart() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

async function createTransitRoute({
  routeName,
  routeNumber,
  transitType,
  origin,
  destination,
  originLat,
  originLng,
  destinationLat,
  destinationLng,
  baseFare,
  stops,
  trip,
}) {
  const route = await prisma.transitRoute.create({
    data: {
      routeName,
      routeNumber,
      transitType,
      origin,
      destination,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      baseFare,

      firstDeparture: trip.departureTime,
      lastDeparture: trip.arrivalTime,

      isActive: true,

      stops: {
        create: stops.map((stop) => ({
          stopName: stop.stopName,
          stopCode: stop.stopCode,
          stopOrder: stop.stopOrder,
          lat: stop.lat,
          lng: stop.lng,
          arrivalTime: stop.arrivalTime,
          departureTime: stop.departureTime,
          distanceFromPrevKm: stop.distanceFromPrevKm,
        })),
      },
    },

    include: {
      stops: {
        orderBy: {
          stopOrder: 'asc',
        },
      },
    },
  })

  const createdTrip = await prisma.trip.create({
    data: {
      routeId: route.id,

      vehicleNumber: trip.vehicleNumber,
      vehicleType: trip.vehicleType,

      driverName: trip.driverName,
      driverPhone: trip.driverPhone,

      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,

      travelDate: todayStart(),

      status: 'scheduled',

      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
    },
  })

  const firstStop = route.stops[0]
  const secondStop = route.stops[1] || firstStop

  await prisma.liveTracking.create({
    data: {
      tripId: createdTrip.id,

      currentStopId: firstStop?.id,
      nextStopId: secondStop?.id,

      currentLat: firstStop?.lat || originLat,
      currentLng: firstStop?.lng || originLng,

      delayMinutes: 0,
      speedKmph: 0,
      bearing: 0,
    },
  })

  console.log(`Route created: ${routeName}`)
  console.log(`Trip created: ${createdTrip.vehicleNumber}`)

  return {
    route,
    trip: createdTrip,
  }
}

async function main() {
  console.log('Starting SmartCity Map database seed...')

  // --------------------------------------------------
  // DELETE EXISTING DATA
  // --------------------------------------------------

  /*
   * Delete dependent data first.
   *
   * Users are intentionally NOT deleted because
   * bookings require existing authenticated users.
   */

  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()

  await prisma.liveTracking.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.transitStop.deleteMany()
  await prisma.transitRoute.deleteMany()

  await prisma.nearbySpecialty.deleteMany()
  await prisma.review.deleteMany()
  await prisma.savedRoute.deleteMany()
  await prisma.place.deleteMany()

  await prisma.schedule.deleteMany()
  await prisma.stop.deleteMany()
  await prisma.route.deleteMany()

  console.log('Old transit and location data cleared.')

  // --------------------------------------------------
  // PLACES
  // --------------------------------------------------

  const places = [
    {
      name: 'Pune Railway Station',
      category: 'transport',
      address: 'Agarkar Nagar, Pune, Maharashtra',
      rating: 4.3,
      openHours: '24 Hours',
      lat: 18.5286,
      lng: 73.8744,
      osmId: 'smartcity-pune-railway-station',
    },

    {
      name: 'Shaniwar Wada',
      category: 'tourist',
      address: 'Shaniwar Peth, Pune, Maharashtra',
      rating: 4.5,
      openHours: '8:00 AM - 6:30 PM',
      lat: 18.5196,
      lng: 73.8553,
      osmId: 'smartcity-shaniwar-wada',
    },

    {
      name: 'Ruby Hall Clinic',
      category: 'hospital',
      address: 'Sassoon Road, Pune, Maharashtra',
      rating: 4.2,
      openHours: '24 Hours',
      lat: 18.5308,
      lng: 73.8765,
      osmId: 'smartcity-ruby-hall',
    },

    {
      name: 'FC Road Cafe',
      category: 'restaurant',
      address: 'Fergusson College Road, Pune, Maharashtra',
      rating: 4.1,
      openHours: '10:00 AM - 11:00 PM',
      lat: 18.5236,
      lng: 73.841,
      osmId: 'smartcity-fc-road-cafe',
    },

    {
      name: 'Phoenix Marketcity Pune',
      category: 'shopping',
      address: 'Viman Nagar, Pune, Maharashtra',
      rating: 4.4,
      openHours: '11:00 AM - 11:00 PM',
      lat: 18.561,
      lng: 73.9167,
      osmId: 'smartcity-phoenix-pune',
    },

    {
      name: 'Talegaon Dabhade Railway Station',
      category: 'transport',
      address: 'Talegaon Dabhade, Maharashtra',
      rating: 4.1,
      openHours: '24 Hours',
      lat: 18.735,
      lng: 73.675,
      osmId: 'smartcity-talegaon-station',
    },

    {
      name: 'Talegaon General Hospital',
      category: 'hospital',
      address: 'Talegaon Dabhade, Maharashtra',
      rating: 4.0,
      openHours: '24 Hours',
      lat: 18.734,
      lng: 73.6758,
      osmId: 'smartcity-talegaon-hospital',
    },

    {
      name: 'Wakad Transit Point',
      category: 'transport',
      address: 'Wakad, Pune, Maharashtra',
      rating: 4.0,
      openHours: '24 Hours',
      lat: 18.5975,
      lng: 73.7898,
      osmId: 'smartcity-wakad-transit',
    },

    {
      name: 'Nashik CBS',
      category: 'transport',
      address: 'Old CBS, Nashik, Maharashtra',
      rating: 4.2,
      openHours: '24 Hours',
      lat: 20.0059,
      lng: 73.7897,
      osmId: 'smartcity-nashik-cbs',
    },

    {
      name: 'Sula Vineyards',
      category: 'tourist',
      address: 'Gangapur-Savargaon Road, Nashik',
      rating: 4.5,
      openHours: '11:00 AM - 11:00 PM',
      lat: 20.0167,
      lng: 73.705,
      osmId: 'smartcity-sula-vineyards',
    },

    {
      name: 'Nashik Civil Hospital',
      category: 'hospital',
      address: 'Trimbak Road, Nashik',
      rating: 4.0,
      openHours: '24 Hours',
      lat: 20.0068,
      lng: 73.771,
      osmId: 'smartcity-nashik-hospital',
    },

    {
      name: 'Nashik Road Railway Station',
      category: 'transport',
      address: 'Nashik Road, Maharashtra',
      rating: 4.2,
      openHours: '24 Hours',
      lat: 19.9715,
      lng: 73.842,
      osmId: 'smartcity-nashik-road-station',
    },
  ]

  await prisma.place.createMany({
    data: places,
  })

  console.log(`Places created: ${places.length}`)

  // --------------------------------------------------
  // TRANSIT ROUTE 101
  // Nashik CBS -> Pune
  // --------------------------------------------------

  await createTransitRoute({
    routeName: 'Nashik CBS to Pune',
    routeNumber: '101',
    transitType: 'bus',

    origin: 'Nashik CBS',
    destination: 'Pune Station',

    originLat: 20.0059,
    originLng: 73.7897,

    destinationLat: 18.5286,
    destinationLng: 73.8744,

    baseFare: 250,

    stops: [
      {
        stopName: 'Nashik CBS',
        stopCode: 'NASHIK-CBS',
        stopOrder: 1,
        lat: 20.0059,
        lng: 73.7897,
        arrivalTime: '06:00',
        departureTime: '06:00',
        distanceFromPrevKm: 0,
      },

      {
        stopName: 'Sinnar',
        stopCode: 'SINNAR',
        stopOrder: 2,
        lat: 19.845,
        lng: 73.998,
        arrivalTime: '06:45',
        departureTime: '06:50',
        distanceFromPrevKm: 35,
      },

      {
        stopName: 'Ahmednagar',
        stopCode: 'AHMEDNAGAR',
        stopOrder: 3,
        lat: 19.0948,
        lng: 74.748,
        arrivalTime: '08:10',
        departureTime: '08:15',
        distanceFromPrevKm: 115,
      },

      {
        stopName: 'Pune Station',
        stopCode: 'PUNE-STN',
        stopOrder: 4,
        lat: 18.5286,
        lng: 73.8744,
        arrivalTime: '09:30',
        departureTime: '09:30',
        distanceFromPrevKm: 120,
      },
    ],

    trip: {
      vehicleNumber: 'MH-15-AB-1234',
      vehicleType: 'bus',
      driverName: 'Ramesh Kumar',
      driverPhone: '9876543210',
      departureTime: '06:00',
      arrivalTime: '09:30',
      totalSeats: 50,
      availableSeats: 45,
    },
  })

  // --------------------------------------------------
  // TRANSIT ROUTE 102
  // Pune -> Talegaon
  // --------------------------------------------------

  await createTransitRoute({
    routeName: 'Pune Station to Talegaon Dabhade',
    routeNumber: '102',
    transitType: 'bus',

    origin: 'Pune Station',
    destination: 'Talegaon Dabhade',

    originLat: 18.5286,
    originLng: 73.8744,

    destinationLat: 18.735,
    destinationLng: 73.675,

    baseFare: 120,

    stops: [
      {
        stopName: 'Pune Station',
        stopCode: 'PUNE-STN',
        stopOrder: 1,
        lat: 18.5286,
        lng: 73.8744,
        arrivalTime: '08:00',
        departureTime: '08:00',
        distanceFromPrevKm: 0,
      },

      {
        stopName: 'Shivajinagar',
        stopCode: 'SHIVAJINAGAR',
        stopOrder: 2,
        lat: 18.5308,
        lng: 73.847,
        arrivalTime: '08:15',
        departureTime: '08:17',
        distanceFromPrevKm: 4,
      },

      {
        stopName: 'Wakad',
        stopCode: 'WAKAD',
        stopOrder: 3,
        lat: 18.5975,
        lng: 73.7898,
        arrivalTime: '08:40',
        departureTime: '08:42',
        distanceFromPrevKm: 9,
      },

      {
        stopName: 'Dehu Road',
        stopCode: 'DEHU-ROAD',
        stopOrder: 4,
        lat: 18.678,
        lng: 73.735,
        arrivalTime: '09:05',
        departureTime: '09:07',
        distanceFromPrevKm: 12,
      },

      {
        stopName: 'Talegaon Dabhade',
        stopCode: 'TALEGAON',
        stopOrder: 5,
        lat: 18.735,
        lng: 73.675,
        arrivalTime: '09:30',
        departureTime: '09:30',
        distanceFromPrevKm: 10,
      },
    ],

    trip: {
      vehicleNumber: 'MH-12-AB-0102',
      vehicleType: 'bus',
      driverName: 'Suresh Patil',
      driverPhone: '9876543211',
      departureTime: '08:00',
      arrivalTime: '09:30',
      totalSeats: 50,
      availableSeats: 45,
    },
  })

  // --------------------------------------------------
  // TRANSIT ROUTE 201
  // Pune -> Talegaon Express
  // TRAIN
  // --------------------------------------------------

  await createTransitRoute({
    routeName: 'Pune Station to Talegaon Express',
    routeNumber: '201',
    transitType: 'train',

    origin: 'Pune Station',
    destination: 'Talegaon Dabhade',

    originLat: 18.5286,
    originLng: 73.8744,

    destinationLat: 18.735,
    destinationLng: 73.675,

    baseFare: 150,

    stops: [
      {
        stopName: 'Pune Station',
        stopCode: 'PUNE-STN',
        stopOrder: 1,
        lat: 18.5286,
        lng: 73.8744,
        arrivalTime: '10:00',
        departureTime: '10:00',
        distanceFromPrevKm: 0,
      },

      {
        stopName: 'Shivajinagar',
        stopCode: 'SHIVAJINAGAR',
        stopOrder: 2,
        lat: 18.5308,
        lng: 73.847,
        arrivalTime: '10:10',
        departureTime: '10:12',
        distanceFromPrevKm: 3,
      },

      {
        stopName: 'Akurdi',
        stopCode: 'AKURDI',
        stopOrder: 3,
        lat: 18.6497,
        lng: 73.7661,
        arrivalTime: '10:30',
        departureTime: '10:32',
        distanceFromPrevKm: 14,
      },

      {
        stopName: 'Talegaon Dabhade',
        stopCode: 'TALEGAON',
        stopOrder: 4,
        lat: 18.735,
        lng: 73.675,
        arrivalTime: '10:50',
        departureTime: '10:50',
        distanceFromPrevKm: 12,
      },
    ],

    trip: {
      vehicleNumber: 'TRAIN-201',
      vehicleType: 'train',
      driverName: 'Railway Operations',
      driverPhone: null,
      departureTime: '10:00',
      arrivalTime: '10:50',
      totalSeats: 120,
      availableSeats: 96,
    },
  })

  // --------------------------------------------------
  // LEGACY GEO ROUTE
  //
  // Kept because the existing application still has
  // Route / Stop / Schedule models.
  // --------------------------------------------------

  const legacyRoute = await prisma.route.create({
    data: {
      name: 'Pune - Talegaon Local',
      transitType: 'bus',
      startPoint: 'Pune Station',
      endPoint: 'Talegaon Dabhade',
      baseFare: 120,
      perKmRate: 8,
      isActive: true,
    },
  })

  await prisma.stop.createMany({
    data: [
      {
        routeId: legacyRoute.id,
        name: 'Pune Station',
        lat: 18.5286,
        lng: 73.8744,
        sequence: 1,
      },

      {
        routeId: legacyRoute.id,
        name: 'Shivajinagar',
        lat: 18.5308,
        lng: 73.847,
        sequence: 2,
      },

      {
        routeId: legacyRoute.id,
        name: 'Wakad',
        lat: 18.5975,
        lng: 73.7898,
        sequence: 3,
      },

      {
        routeId: legacyRoute.id,
        name: 'Dehu Road',
        lat: 18.678,
        lng: 73.735,
        sequence: 4,
      },

      {
        routeId: legacyRoute.id,
        name: 'Talegaon Dabhade',
        lat: 18.735,
        lng: 73.675,
        sequence: 5,
      },
    ],
  })

  await prisma.schedule.create({
    data: {
      routeId: legacyRoute.id,

      departureTime: '08:00',
      arrivalTime: '09:30',

      daysActive: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],

      vehicleNumber: 'MH-12-AB-0102',
    },
  })

  console.log('Legacy route and schedule created.')

  // --------------------------------------------------
  // COMPLETION
  // --------------------------------------------------

  console.log('')
  console.log('==========================================')
  console.log('SmartCity Map seed completed successfully')
  console.log('==========================================')

  console.log('Routes:')
  console.log('101 - Nashik CBS -> Pune')
  console.log('102 - Pune Station -> Talegaon Dabhade')
  console.log('201 - Pune Station -> Talegaon Dabhade Express')

  console.log('')
  console.log('Transport:')
  console.log('Bus 101 - Nashik -> Pune')
  console.log('Bus 102 - Pune -> Talegaon')
  console.log('Train 201 - Pune -> Talegaon')

  console.log('')
  console.log('All seeded trips have available seats.')
  console.log('Existing users were preserved.')
}

main()
  .catch((error) => {
    console.error('Seed failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })