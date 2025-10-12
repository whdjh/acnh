import { db } from "@/lib/db";
import { caughtItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, category, itemName } = await req.json();

  // 이미 잡은 상태인지 확인
  const exists = await db
    .select()
    .from(caughtItems)
    .where(
      and(
        eq(caughtItems.userId, userId),
        eq(caughtItems.category, category),
        eq(caughtItems.itemName, itemName)
      )
    );

  if (exists.length > 0) {
    // 이미 잡은 상태 → 해제
    await db
      .delete(caughtItems)
      .where(
        and(
          eq(caughtItems.userId, userId),
          eq(caughtItems.category, category),
          eq(caughtItems.itemName, itemName)
        )
      );
    return NextResponse.json({ ok: true, caught: false });
  } else {
    // 새로 잡기 등록
    await db.insert(caughtItems).values({ userId, category, itemName });
    return NextResponse.json({ ok: true, caught: true });
  }
}
