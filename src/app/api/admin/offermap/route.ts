import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

const bodySchema = z.object({
  offerId: z.string().min(1),
  productId: z.coerce.number().int().positive(),
  adminPassword: z.string().optional(),
});

export async function GET(request: Request) {
  if (!verifyAdminRequest(request.headers)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const offerMaps = await prisma.offerMap.findMany({
      orderBy: { id: "asc" },
      include: { product: { select: { id: true, title: true, productKey: true } } },
    });
    return NextResponse.json({ ok: true, offerMaps });
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
    const { offerId, productId } = bodySchema.parse(body);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    const offerMap = await prisma.offerMap.create({
      data: { offerId, productId },
    });
    return NextResponse.json({ ok: true, offerMap });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: "Неверные данные" }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

