import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username } = await req.json();
  const result = await db.select().from(users).where(eq(users.username, username));

  if (result.length === 0) {
    return NextResponse.json({ ok: false, error: "User not found" });
  }

  return NextResponse.json({ ok: true, user: result[0] });
}
