import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
});

type CodeRow = { id: number; status: string };

async function tryMarkInStockCode(normalized: string): Promise<"updated" | "not_found" | "already"> {
  try {
    const rows = await prisma.$queryRaw<CodeRow[]>`
      SELECT id, status
      FROM "StockCode"
      WHERE "codeText" = ${normalized}
      LIMIT 1
    `;

    if (!rows.length) return "not_found";
    if (rows[0].status === "delivered") return "already";

    await prisma.$executeRaw`
      UPDATE "StockCode"
      SET "status" = 'delivered', "deliveredAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${rows[0].id}
    `;

    return "updated";
  } catch {
    return "not_found";
  }
}

async function tryMarkInLegacyCode(normalized: string): Promise<"updated" | "not_found" | "already"> {
  try {
    const rows = await prisma.$queryRaw<CodeRow[]>`
      SELECT id, status
      FROM "Code"
      WHERE "code" = ${normalized}
      LIMIT 1
    `;

    if (!rows.length) return "not_found";
    if (rows[0].status === "used") return "already";

    await prisma.$executeRaw`
      UPDATE "Code"
      SET "status" = 'used', "used_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${rows[0].id}
    `;

    return "updated";
  } catch {
    return "not_found";
  }
}

export async function POST(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = schema.parse(body);
    const normalized = code.trim().toUpperCase();

    const stockResult = await tryMarkInStockCode(normalized);
    if (stockResult === "updated") {
      return NextResponse.json({ ok: true, message: "Код активирован вручную" });
    }
    if (stockResult === "already") {
      return NextResponse.json({ ok: false, error: "Код уже активирован" }, { status: 400 });
    }

    const legacyResult = await tryMarkInLegacyCode(normalized);
    if (legacyResult === "updated") {
      return NextResponse.json({ ok: true, message: "Код активирован вручную" });
    }
    if (legacyResult === "already") {
      return NextResponse.json({ ok: false, error: "Код уже использован" }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "Код не найден" }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Неверные данные" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
