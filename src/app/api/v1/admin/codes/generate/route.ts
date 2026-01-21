import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

// Конфигурация генерации кодов
const CODE_CONFIG = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 16,
  BATCH_SIZE: 100, // Размер батча для проверки уникальности
  MAX_ATTEMPTS: 50,
  CHARACTER_SET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // Исключаем похожие символы (0,O,1,I)
} as const;

// POST - сгенерировать коды
export async function POST(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const schema = z.object({
    count: z.number().min(1).max(1000),
    nominal: z.number().min(1),
    prefix: z
      .string()
      .min(2)
      .max(6)
      .regex(/^[A-Z0-9]+$/)
      .optional()
      .default("RBX"),
    productType: z.enum(["roblox", "fortnite", "pubg", "other"]).optional().default("roblox"),
  });

  try {
    const body = await request.json();
    const { count, nominal, prefix, productType } = schema.parse(body);

    const codes = await generateSecureCodes(count, prefix, nominal, productType);

    const createdCodes = await prisma.legacyCode.createMany({
      data: codes,
    });

    await logCodeGeneration(createdCodes.count, nominal, prefix);

    return NextResponse.json({
      ok: true,
      count: createdCodes.count,
      codes: codes.map((c) => c.code),
      message: `Успешно сгенерировано ${createdCodes.count} кодов номиналом ${nominal} Robux`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Неверные данные: " + error.issues.map((e) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    console.error("Code generation error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Ошибка сервера при генерации кодов",
      },
      { status: 500 }
    );
  }
}

// Улучшенная генерация безопасных кодов
async function generateSecureCodes(
  count: number,
  prefix: string,
  nominal: number,
  productType: "roblox" | "fortnite" | "pubg" | "other"
) {
  const codes: Array<{ code: string; nominal: number; status: "active"; product_type: string }> = [];
  const existingCodes = await getExistingCodes();

  let generatedCount = 0;
  let totalAttempts = 0;

  while (
    generatedCount < count &&
    totalAttempts < CODE_CONFIG.MAX_ATTEMPTS * count
  ) {
    const batch: string[] = [];

    // Генерируем батч кодов
    for (
      let i = 0;
      i < Math.min(CODE_CONFIG.BATCH_SIZE, count - generatedCount);
      i++
    ) {
      const code = generateSingleCode(prefix);
      if (!existingCodes.has(code) && !batch.includes(code)) {
        batch.push(code);
      }
    }

    // Проверяем уникальность в базе данных
    const uniqueBatch = await verifyBatchUniqueness(batch);

    // Добавляем уникальные коды
    for (const code of uniqueBatch) {
      codes.push({
        code,
        nominal,
        status: "active",
        product_type: productType,
      });
      existingCodes.add(code);
      generatedCount++;
    }

    totalAttempts++;

    if (totalAttempts >= CODE_CONFIG.MAX_ATTEMPTS * count) {
      throw new Error(
        "Превышено максимальное количество попыток генерации уникальных кодов"
      );
    }
  }

  return codes;
}

// Генерация одного кода с криптографически безопасным RNG
function generateSingleCode(prefix: string): string {
  const randomBytes = crypto.randomBytes(8);
  let code = prefix.toUpperCase() + "-";

  // Генерируем основную часть кода
  for (let i = 0; i < 8; i++) {
    const randomIndex = randomBytes[i] % CODE_CONFIG.CHARACTER_SET.length;
    code += CODE_CONFIG.CHARACTER_SET[randomIndex];

    // Добавляем дефис для лучшей читаемости
    if (i === 3) code += "-";
  }

  // Добавляем контрольную сумму
  const checksum = generateChecksum(code);
  code += `-${checksum}`;

  return code;
}

// Генерация простой контрольной суммы
function generateChecksum(code: string): string {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    sum += code.charCodeAt(i);
  }
  return CODE_CONFIG.CHARACTER_SET[sum % CODE_CONFIG.CHARACTER_SET.length];
}

// Получение существующих кодов из базы
async function getExistingCodes(): Promise<Set<string>> {
  const existing = await prisma.legacyCode.findMany({
    select: { code: true },
    take: 10000, // Ограничиваем для производительности
  });
  return new Set(existing.map((c) => c.code));
}

// Проверка уникальности батча кодов в базе данных
async function verifyBatchUniqueness(codes: string[]): Promise<string[]> {
  if (codes.length === 0) return [];

  const existing = await prisma.legacyCode.findMany({
    where: {
      code: { in: codes },
    },
    select: { code: true },
  });

  const existingSet = new Set(existing.map((c) => c.code));
  return codes.filter((code) => !existingSet.has(code));
}

// Логирование генерации кодов (опционально)
async function logCodeGeneration(
  count: number,
  nominal: number,
  prefix: string
) {
  // Здесь можно добавить логирование в отдельную таблицу
  // или отправить уведомление администратору
  console.log(
    `Generated ${count} codes with prefix ${prefix} and nominal ${nominal}`
  );
}

// GET - получить статистику по кодам (дополнительная функция)
export async function GET(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const stats = await prisma.legacyCode.groupBy({
      by: ["status", "nominal"],
      _count: {
        _all: true,
      },
    });

    return NextResponse.json({
      ok: true,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: `Ошибка при получении статистики ${error}`,
      },
      { status: 500 }
    );
  }
}
