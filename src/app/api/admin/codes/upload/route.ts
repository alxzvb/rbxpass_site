import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

const bodySchema = z.object({
  productId: z.coerce.number().int().positive(),
  codes: z.string().min(1),
  adminPassword: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyAdminRequest(request.headers, body.adminPassword)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { productId, codes } = bodySchema.parse(body);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const codeLines = codes
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (codeLines.length === 0) {
      return NextResponse.json({ ok: false, error: "No codes provided" }, { status: 400 });
    }

    let created = 0;
    for (const codeText of codeLines) {
      try {
        await prisma.code.create({
          data: {
            productId,
            codeText,
            status: "available",
          },
        });
        created++;
      } catch (error: unknown) {
        // Игнорируем ошибки дубликатов
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      total: codeLines.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Неверные данные" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
