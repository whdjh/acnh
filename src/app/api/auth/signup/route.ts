import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username, hemisphere } = await req.json();

    if (!username || !hemisphere) {
      return NextResponse.json({ ok: false, error: "Invalid input" });
    }

    // 아이디 중복 체크
    const exists = await db.select().from(users).where(eq(users.username, username));
    if (exists.length > 0) {
      return NextResponse.json({ ok: false, error: "이미 존재하는 아이디입니다." });
    }

    // 신규 유저 생성
    const [newUser] = await db
      .insert(users)
      .values({ username, hemisphere })
      .returning();

    return NextResponse.json({ ok: true, user: newUser });
  } catch (error) {
    console.error("회원가입 실패:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" });
  }
}
