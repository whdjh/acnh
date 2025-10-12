import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.SUPABASE_URL!, {
  ssl: "require",
  user: "postgres",
  pass: process.env.SUPABASE_SERVICE_ROLE_KEY!,
});

export const db = drizzle(client);
