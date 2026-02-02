import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { caughtItems, categoryEnum } from "@/db/schema"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

type Category = (typeof categoryEnum.enumValues)[number]
function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (categoryEnum.enumValues as readonly string[]).includes(v)
}

// POST /api/caught/toggle
// body: { userId: number|string, category: "fish"|"bug"|"sea"|"fossil", itemName: string }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = Number(body.userId)
    const categoryStr = body.category as unknown
    const itemName = typeof body.itemName === "string" ? body.itemName.trim() : ""

    if (!Number.isFinite(userId) || !isCategory(categoryStr) || !itemName) {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 })
    }
    const category: Category = categoryStr

    // 1) 먼저 insert 시도
    const inserted = await db
      .insert(caughtItems)
      .values({ userId, category, itemName })
      .onConflictDoNothing()
      .returning({ id: caughtItems.id }); // 충돌이면 빈 배열이 반환됨

    if (inserted.length > 0) {
      // 새로 추가됨 → caught: true
      return NextResponse.json({ ok: true, caught: true }, {
        headers: { "Cache-Control": "no-store" },
      })
    }

    // 2) 이미 있었던 항목 → 삭제 후 caught: false
    await db
      .delete(caughtItems)
      .where(and(
        eq(caughtItems.userId, userId),
        eq(caughtItems.category, category),
        eq(caughtItems.itemName, itemName)
      ))

    return NextResponse.json({ ok: true, caught: false }, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (e) {
    console.error("POST /api/caught/toggle error:", e)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
