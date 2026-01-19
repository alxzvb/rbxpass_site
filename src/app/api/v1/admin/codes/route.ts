import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";
import { z } from "zod";

// GET - получить все коды
export async function GET(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const codes = await prisma.legacyCode.findMany({
      orderBy: { id: "desc" },
      take: 1000,
    });
    return NextResponse.json({ ok: true, codes });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

// POST - создать новый код
export async function POST(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) return new NextResponse("Unauthorized", { status: 401 });

  const schema = z.object({
    code: z.string().min(1),
    nominal: z.number().min(1),
    status: z.enum(["active", "used"]).default("active"),
    productType: z.enum(["roblox", "fortnite", "pubg", "other"]).optional().default("roblox"),
  });

  try {
    const body = await request.json();
    const { code, nominal, status, productType } = schema.parse(body);

    // Проверяем формат кода
    const CODE_REGEX = /^RBX100-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
    if (!CODE_REGEX.test(code)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверный формат кода. Используйте формат: RBX100-XXXX-XXXX" 
      }, { status: 400 });
    }

    // Проверяем, не существует ли уже такой код
    const existingCode = await prisma.legacyCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCode) {
      return NextResponse.json({ 
        ok: false, 
        error: "Код уже существует" 
      }, { status: 409 });
    }

    const newCode = await prisma.legacyCode.create({
      data: {
        code: code.toUpperCase(),
        nominal,
        status,
        product_type: productType,
      }
    });

    return NextResponse.json({ ok: true, code: newCode });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        ok: false, 
        error: "Неверные данные: " + error.issues.map(e => e.message).join(", ") 
      }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
