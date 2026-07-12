import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { serverConfig } from "./config";

const pool = new Pool({
  connectionString: serverConfig.DATABASE_URL,
});

export const db = drizzle(pool);
