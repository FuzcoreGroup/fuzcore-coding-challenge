import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./server/db/migrations",
  schema: "./server/db/schema.ts",
  dialect: "sqlite",          // Change from 'postgresql' to 'sqlite'
  dbCredentials: {
    url: "./sqlite.db",       // SQLite file path
  },
});