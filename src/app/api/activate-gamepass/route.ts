import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewOrderTelegramNotification } from "@/lib/telegram";
import { z } from "zod";

const bodySchema = z.object({
  code: z.string().min(1),
  productType: z.enum(["roblox", "fortnite", "pubg", "other"]).default("roblox"),
  gamepassUrl: z.string().url().optional(),
  gamepassId: z.string().regex(/^\d+$/).optional(),
  regionalPricingDisabled: z.boolean().optional(),
  nickname: z.string().min(1).optional(),
  epicLogin: z.string().min(1).optional(),
  epicPassword: z.string().min(1).optional(),
  telegram: z.string().min(1).optional(),
});

const CODE_REGEX = {
  OLD: /^RBX100-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
  NEW: /^[A-Z0-9]{2,6}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{1}$/i,
} as const;

function verifyChecksum(code: string): boolean {
  if (CODE_REGEX.OLD.test(code)) return true;
  const parts = code.split("-");
  if (parts.length !== 4) return false;
  const [prefix, part1, part2, checksum] = parts;
  const base = `${prefix}-${part1}-${part2}`;
  const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum += base.charCodeAt(i);
  const expected = CHARSET[sum % CHARSET.length];
  return checksum === expected;
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверные данные"
      }, { status: 400 });
    }
    
    const {
      code,
      gamepassUrl,
      gamepassId,
      regionalPricingDisabled,
      nickname,
      productType,
      epicLogin,
      epicPassword,
      telegram,
    } = parsed.data;

    // Проверяем формат кода (оба формата)
    const normalizedCode = code.toUpperCase().trim();
    const isValidFormat = CODE_REGEX.OLD.test(normalizedCode) || CODE_REGEX.NEW.test(normalizedCode);
    if (!isValidFormat) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверный формат кода. Пример: RBX-ABCD-EFGH-5" 
      }, { status: 400 });
    }

    // Для нового формата проверяем контрольную сумму
    if (CODE_REGEX.NEW.test(normalizedCode) && !verifyChecksum(normalizedCode)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверная контрольная сумма кода" 
      }, { status: 400 });
    }

    // Проверяем, что код существует и активен
    const codeRow = await prisma.legacyCode.findUnique({ 
      where: { code: normalizedCode } 
    });
    
    if (!codeRow) {
      return NextResponse.json({ 
        ok: false, 
        error: "Код не найден" 
      }, { status: 404 });
    }
    
    if (codeRow.status !== "active") {
      return NextResponse.json({ 
        ok: false, 
        error: "Код уже использован" 
      }, { status: 409 });
    }

    const resolvedType = codeRow.product_type ?? productType;
    let resolvedGamepassId = "";
    let safeNickname = nickname?.trim() || "";
    const safeGamepassUrl = gamepassUrl?.trim() || "";
    const safeGamepassId = gamepassId?.trim() || "";

    if (resolvedType === "roblox") {
      if (!safeNickname || (!safeGamepassUrl && !safeGamepassId) || !telegram) {
        return NextResponse.json({ ok: false, error: "Укажите ник, ссылку или Pass ID и Telegram" }, { status: 400 });
      }

      if (!regionalPricingDisabled) {
        return NextResponse.json(
          { ok: false, error: "Подтвердите, что выставили верную цену и отключили Regional Pricing" },
          { status: 400 }
        );
      }

      if (safeGamepassId) {
        resolvedGamepassId = safeGamepassId;
      } else {
        // Извлекаем ID GamePass из URL
        const gamepassMatch = safeGamepassUrl.match(/\/game-pass\/(\d+)/);
        if (!gamepassMatch) {
          return NextResponse.json({
            ok: false,
            error: "Неверная ссылка на GamePass",
          }, { status: 400 });
        }
        resolvedGamepassId = gamepassMatch[1];
      }
    }

    if (resolvedType === "fortnite") {
      if (!epicLogin || !epicPassword || !telegram) {
        return NextResponse.json({ ok: false, error: "Укажите логин, пароль Epic Games и Telegram" }, { status: 400 });
      }
      safeNickname = epicLogin.trim();
    }

    if (resolvedType === "pubg" || resolvedType === "other") {
      if (!telegram) {
        return NextResponse.json({ ok: false, error: "Укажите Telegram для связи" }, { status: 400 });
      }
    }

    // Генерируем короткий код для отслеживания
    const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        short_code: shortCode,
        code: normalizedCode,
        nickname: safeNickname || "-",
        user_id: resolvedType === "roblox" ? "gamepass_user" : "manual_user",
        gamepass_id: resolvedGamepassId || "-",
        gamepass_url: safeGamepassUrl || "-",
        product_type: resolvedType,
        contact_telegram: telegram?.trim() || null,
        epic_login: epicLogin?.trim() || null,
        epic_password: epicPassword?.trim() || null,
        status: "queued",
      }
    });

    const notifyGamepassUrl =
      safeGamepassUrl || (resolvedGamepassId ? `https://www.roblox.com/game-pass/${resolvedGamepassId}` : "-");

    await sendNewOrderTelegramNotification({
      amount: codeRow.nominal,
      gamepassUrl: notifyGamepassUrl,
      orderId: order.id,
      customerTelegram: order.contact_telegram ?? "-",
      createdAt: order.created_at,
    });

    await prisma.legacyCode.update({
      where: { id: codeRow.id },
      data: { 
        status: "used",
        used_at: new Date(),
      }
    });

    return NextResponse.json({ 
      ok: true, 
      nominal: codeRow.nominal,
      order: {
        id: order.id,
        short_code: order.short_code,
        status: order.status,
        created_at: order.created_at,
      },
      message: resolvedType === "roblox"
        ? `Код успешно активирован! Код заказа: ${order.short_code}`
        : `Заявка создана. Мы свяжемся с вами в Telegram. Код заказа: ${order.short_code}`
    });
  } catch (error) {
    console.error("Activate GamePass error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Ошибка сервера" 
    }, { status: 500 });
  }
}
