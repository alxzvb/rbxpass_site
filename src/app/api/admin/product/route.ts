import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

const bodySchema = z.object({
  title: z.string().min(1),
  productKey: z.string().min(1),
  adminPassword: z.string().optional(),
});

export async function GET(request: Request) {
  if (!verifyAdminRequest(request.headers)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      select: { id: true, title: true, productKey: true, createdAt: true },
    });

    const counts = await prisma.code.groupBy({
      by: ["productId"],
      where: { status: "available" },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((row) => [row.productId, row._count._all]));

    return NextResponse.json({
      ok: true,
      products: products.map((product) => ({
        ...product,
        available: countMap.get(product.id) ?? 0,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyAdminRequest(request.headers, body.adminPassword)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { title, productKey } = bodySchema.parse(body);
    const product = await prisma.product.create({
      data: { title, productKey },
    });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Неверные данные" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

