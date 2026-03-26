import dotenv from "dotenv";

dotenv.config();

function getEnv(key: string, fallback?: string) {
  const value = process.env[key];
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return fallback;
}

export const serverConfig = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: Number(getEnv("PORT", "5000")),
  DATABASE_URL: getEnv("DATABASE_URL", ""),
  JWT_SECRET: getEnv("JWT_SECRET", "shh-very-secret"),
  PAYSTACK_SECRET_KEY: getEnv("PAYSTACK_SECRET_KEY", ""),
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY", ""),
};

if (!serverConfig.DATABASE_URL) {
  throw new Error("Missing required environment variable DATABASE_URL");
}
