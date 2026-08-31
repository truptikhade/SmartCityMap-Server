const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
require('dotenv').config()

// Create pg connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create adapter
const adapter = new PrismaPg(pool)

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter })

prisma.$connect()
  .then(() => console.log('Prisma connected'))
  .catch((err) => console.error('Prisma error:', err))

module.exports = prisma