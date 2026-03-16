const DEFAULT_API_BASE_URL = "https://mofitness-backend.onrender.com";

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
const resolved = (fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_API_BASE_URL).replace(
  /\/$/,
  "",
);

export const API_BASE_URL = resolved;
