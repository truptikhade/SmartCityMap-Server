## SmartCity Map: Backend API Server

Live Link : https://smart-city-map-client-six.vercel.app

AI-Powered Urban Transit & Navigation Platform Backend built with **Node.js 22**, **Express 5**, **Prisma 7**, **PostgreSQL 17**, and **Socket.io 4**, **Redis**, **JWT auth**, **AI/LLM integration**.

---

## Production deployment (Railway backend + Vercel frontend)

Do not commit `.env` files or put server credentials in the frontend. Use
Railway's service Variables and Vercel's Project Environment Variables.

### Railway backend

Set these variables for the server service:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `TZ` | `Asia/Kolkata` (schedule times are interpreted as India local time) |
| `DATABASE_URL` | Railway PostgreSQL connection string; the database must support PostGIS |
| `REDIS_URL` | Railway Redis connection URL |
| `JWT_SECRET` | A long, randomly generated private secret |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `CLIENT_URL` | `https://smart-city-map-client-six.vercel.app` |
| `PORT` | Use Railway's injected value; do not hard-code it |

Optional integrations require their corresponding secrets: `GEMINI_API_KEY`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and the `MAIL_*` settings. Without
these, the related AI, payment, or email features may not work.

Set the Railway service's start command to `npm start`. Apply committed
database migrations to the production database with `npx prisma migrate deploy`
before serving traffic. Do not run `npm run seed` against production.

Redis connection attempts are bounded and do not prevent the API from
starting. If Redis is unavailable, rate limiting uses the in-memory fallback
and Socket.IO runs without the Redis adapter; configure a valid `REDIS_URL` for
shared rate limits and multi-instance socket broadcasting.

### Vercel frontend

Set `NEXT_PUBLIC_SERVER_URL` in Vercel to the public Railway backend URL, for
example `https://your-backend.up.railway.app` (without `/api` or a trailing
slash), then redeploy so Next.js builds with that value.

The backend `CLIENT_URL` accepts a comma-separated list if more than one
frontend origin should be allowed. Keep it limited to trusted domains.

Safe variable-name templates are in the root `.env.example` and client
`.env.example`; replace placeholders in the hosting dashboards, not in
committed files.
