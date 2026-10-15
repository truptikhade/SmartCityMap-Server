import {PrismaPg} from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import "dotenv/config"

// Create pg connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
// Create adapter
const adapter = new PrismaPg(pool);
// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

prisma
  .$connect()
  .then(() => console.log("Prisma connected"))
  .catch((err) => console.error("Prisma error:", err));

export default prisma;
