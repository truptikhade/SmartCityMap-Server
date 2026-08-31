## SmartCity Map — Backend API Server

AI-Powered Urban Transit & Navigation Platform Backend built with **Node.js 22**, **Express 5**, **Prisma 7**, **PostgreSQL 17**, and **Socket.io 4**.

---

## Architecture & Folder Structure


server/
├── prisma/
│   └── schema.prisma         # Database schemas (auth, geo, transit, booking, public)
├── src/
│   ├── config/               # Database, Redis, and environment configs
│   ├── controllers/          # HTTP request handlers
│   ├── middlewares/          # JWT, Auth, Joi validation, rate limiters
│   ├── repositories/         # Prisma query wrappers
│   ├── routes/               # API route definitions
│   ├── services/             # Business logic & payment integrations
│   ├── sockets/              # Socket.io live tracking event handlers
│   └── app.js                # Express app & server entry point
├── .env.example              # Environment variable template
└── package.json
