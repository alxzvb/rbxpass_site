import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { buildGamePassUrl } from "@/lib/roblox";

const schema = z.object({
  code: z.string(),
  nickname: z.string(),
  userId: z.number(),
  gamePassId: z.number(),
  gamePassUrl: z.string().url().optional(),
});

const CODE_REGEX = /^RBX100-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

function generateShortCode(): string {
  const base = Math.random().toString(36).slice(2, 8).toUpperCase();
  return base;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const { code, nickname, userId, gamePassId, gamePassUrl } = schema.parse(payload);

    if (!CODE_REGEX.test(code)) {
      return NextResponse.json({ ok: false, error: "Неверный формат кода" }, { status: 400 });
    }

    const codeRow = await prisma.legacyCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!codeRow) {
      return NextResponse.json({ ok: false, error: "Код не найден" }, { status: 404 });
    }
    if (codeRow.status !== "active") {
      return NextResponse.json({ ok: false, error: "Код уже использован" }, { status: 409 });
    }

    const shortCode = generateShortCode();
    const url = gamePassUrl ?? buildGamePassUrl(gamePassId);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          short_code: shortCode,
          code: code.toUpperCase(),
          nickname,
          user_id: String(userId),
          gamepass_id: String(gamePassId),
          gamepass_url: url,
          status: "queued",
        },
      });
      await tx.legacyCode.update({ where: { code: code.toUpperCase() }, data: { status: "used", used_at: new Date() } });
      return created;
    });

    return NextResponse.json({ ok: true, message: "✅ Заказ принят! Robux будут начислены в течение 5–7 дней.", order: { id: order.id, short_code: order.short_code } });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}


