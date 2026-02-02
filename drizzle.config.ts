// drizzle.config.ts
import * as dotenv from "dotenv"
import { defineConfig } from "drizzle-kit"

// 1순위 .env.local, 없으면 .env 사용 (원하면 순서 바꿔도 OK)
dotenv.config({ path: ".env.local" }) || dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set (from .env.local or .env)")
}

export default defineConfig({
  schema: ["./src/db/schema.ts"],
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // e.g. postgres://...?...sslmode=require
  },
})
