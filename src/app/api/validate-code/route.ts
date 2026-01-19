import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError } from "zod";

const bodySchema = z.object({ code: z.string() });

// Обновленные регулярные выражения для нового формата
const CODE_REGEX = {
  OLD: /^RBX100-[A-Z0-9]{4}-[A-Z0-9]{4}$/i, // Старый формат
  NEW: /^[A-Z0-9]{2,6}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{1}$/i, // Новый формат
};

// Функция проверки контрольной суммы
function verifyChecksum(code: string): boolean {
  if (CODE_REGEX.OLD.test(code)) {
    return true; // Старые коды без контрольной суммы
  }
  
  const parts = code.split('-');
  if (parts.length !== 4) return false;
  
  const [prefix, part1, part2, checksum] = parts;
  const codeWithoutChecksum = `${prefix}-${part1}-${part2}`;
  
  let sum = 0;
  for (let i = 0; i < codeWithoutChecksum.length; i++) {
    sum += codeWithoutChecksum.charCodeAt(i);
  }
  
  const expectedChecksum = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[sum % 32];
  return checksum === expectedChecksum;
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Неверный формат кода" }, { status: 400 });
    }
    
    const { code } = parsed.data;
    const normalizedCode = code.toUpperCase().trim();

    // Проверяем оба формата
    const isValidFormat = CODE_REGEX.OLD.test(normalizedCode) || CODE_REGEX.NEW.test(normalizedCode);
    if (!isValidFormat) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверный формат кода. Пример: RBX-ABCD-EFGH-5" 
      }, { status: 400 });
    }

    // Проверяем контрольную сумму для новых кодов
    if (CODE_REGEX.NEW.test(normalizedCode) && !verifyChecksum(normalizedCode)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверная контрольная сумма кода" 
      }, { status: 400 });
    }

    // Ищем код в базе
    const codeRow = await prisma.legacyCode.findUnique({ 
      where: { code: normalizedCode } 
    });
    
    if (!codeRow) {
      return NextResponse.json({ ok: false, error: "Код не найден" }, { status: 404 });
    }
    
    if (codeRow.status !== "active") {
      return NextResponse.json({ ok: false, error: "Код уже использован" }, { status: 409 });
    }

    // Валидация прошла, но код НЕ помечаем использованным на этом шаге
    // Возвращаем информацию о коде для подтверждения на втором шаге
    return NextResponse.json({ 
      ok: true, 
      nominal: codeRow.nominal,
      productType: codeRow.product_type ?? "roblox",
      message: "Код проверен и готов к активации"
    });
    
  } catch (err) {
    console.error("Code activation error:", err);
    
    const isZod = err instanceof ZodError;
    const status = isZod ? 400 : 500;
    const message = isZod ? "Неверный формат кода" : "Ошибка сервера при активации кода";
    
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}