const allowedOrigins = [
  "https://smart-city-map-client-six.vercel.app",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin.replace(/\/+$/, ""))) return true;
  return /^https:\/\/smart-city-map-client-[a-z0-9-]+\.vercel\.app$/.test(
    origin,
  );
};
