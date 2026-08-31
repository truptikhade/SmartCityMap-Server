const { PrismaClient } = require('@prisma/client')
const { PrismaPg }     = require('@prisma/adapter-pg')
const { Pool }         = require('pg')
require('dotenv').config()

const pool    = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma  = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Clear existing records in correct foreign-key dependency order (Children -> Parent)
  await prisma.transitStop.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.transitRoute.deleteMany()
  await prisma.place.deleteMany()

  // 2. Create Transit Route
  const route = await prisma.transitRoute.create({
    data: {
      routeName:      'Nashik CBS to Pune',
      routeNumber:    '101',
      transitType:    'bus',
      origin:         'Nashik CBS',
      destination:    'Pune Station',
      originLat:      19.9975,
      originLng:      73.7898,
      destinationLat: 18.5204,
      destinationLng: 73.8567,
      baseFare:       250,
      firstDeparture: '06:00',
      lastDeparture:  '23:00',
      isActive:       true,
    },
  })
  console.log('✅ Route created:', route.routeName)

  // 3. Create Stops
  const stopsData = [
    { stopName: 'Nashik CBS',   stopOrder: 1, lat: 19.9975, lng: 73.7898, arrivalTime: '06:00' },
    { stopName: 'Sinnar',       stopOrder: 2, lat: 19.8483, lng: 74.0042, arrivalTime: '06:45' },
    { stopName: 'Ahmednagar',   stopOrder: 3, lat: 19.0948, lng: 74.7480, arrivalTime: '08:00' },
    { stopName: 'Pune Station', stopOrder: 4, lat: 18.5204, lng: 73.8567, arrivalTime: '09:30' },
  ]

  for (const stop of stopsData) {
    await prisma.transitStop.create({
      data: { routeId: route.id, ...stop },
    })
  }
  console.log('✅ Stops created:', stopsData.length)

  // 4. Create Trip (Normalized to start of today in UTC to simplify date querying)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const trip = await prisma.trip.create({
    data: {
      routeId:        route.id,
      vehicleNumber:  'MH-15-AB-1234',
      vehicleType:    'bus',
      driverName:     'Ramesh Kumar',
      driverPhone:    '9876543210',
      departureTime:  '06:00',
      arrivalTime:    '09:30',
      travelDate:     today,
      status:         'scheduled',
      totalSeats:     50,
      availableSeats: 45,
    },
  })
  console.log('✅ Trip created:', trip.vehicleNumber)

  // 5. Create Places
  const places = [
    { name: 'Civil Hospital Nashik', category: 'hospital',   address: 'Near CBS, Nashik',      lat: 19.9981, lng: 73.7910, rating: 4.2 },
    { name: 'Big Bazaar Nashik',     category: 'market',     address: 'College Road, Nashik',  lat: 19.9955, lng: 73.7875, rating: 4.0 },
    { name: 'Hotel Panchavati',      category: 'restaurant', address: 'Panchavati, Nashik',    lat: 20.0030, lng: 73.7780, rating: 4.5 },
    { name: 'SBI ATM CBS',           category: 'atm',        address: 'CBS Stand, Nashik',     lat: 19.9970, lng: 73.7895, rating: 3.8 },
    { name: 'Trimbakeshwar Temple',  category: 'temple',     address: 'Trimbak Road, Nashik',  lat: 19.9344, lng: 73.5311, rating: 4.9 },
    { name: 'MedPlus Pharmacy',      category: 'pharmacy',   address: 'Mahatma Nagar, Nashik', lat: 19.9990, lng: 73.7920, rating: 4.1 },
  ]

  for (const place of places) {
    await prisma.place.create({ data: place })
  }

  const talegaonPlaces = [
    { name: 'Talegaon Railway Station',   category: 'other',      address: 'Station Road, Talegaon Dabhade', lat: 18.7346, lng: 73.6748, rating: 4.0 },
    { name: 'Talegaon General Hospital',  category: 'hospital',   address: 'Talegaon Dabhade',               lat: 18.7360, lng: 73.6800, rating: 4.1 },
    { name: 'D-Mart Talegaon',            category: 'market',     address: 'MIDC Road, Talegaon',            lat: 18.7300, lng: 73.6750, rating: 4.3 },
    { name: 'Hotel Kinara',               category: 'restaurant', address: 'Pune-Mumbai Highway, Talegaon',  lat: 18.7330, lng: 73.6820, rating: 4.2 },
    { name: 'HDFC Bank ATM Talegaon',     category: 'atm',        address: 'Chowk, Talegaon Dabhade',        lat: 18.7355, lng: 73.6790, rating: 3.9 },
    { name: 'MedPlus Talegaon',           category: 'pharmacy',   address: 'Station Road, Talegaon',         lat: 18.7340, lng: 73.6760, rating: 4.0 },
  ]

  for (const place of talegaonPlaces) {
    await prisma.place.create({ data: place })
  }

  console.log('✅ Places created:', places.length + talegaonPlaces.length)
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })