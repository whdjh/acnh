import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

const client = postgres(process.env.SUPABASE_URL!, {
  ssl: { rejectUnauthorized: false },
  connect_timeout: 30,
})

export const db = drizzle(client)