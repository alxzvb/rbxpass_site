import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const productType = searchParams.get("productType") || undefined;
  const q = searchParams.get("q") || undefined;

  const where: {
    status?: string;
    product_type?: string;
    OR?: Array<{
      short_code?: { contains: string };
      nickname?: { contains: string };
      code?: { contains: string };
    }>;
  } = {};
  if (status) where.status = status;
  if (productType && productType !== "all") where.product_type = productType;
  if (q) where.OR = [
    { short_code: { contains: q } },
    { nickname: { contains: q } },
    { code: { contains: q } },
  ];

  const orders = await prisma.order.findMany({
    where,
    orderBy: { created_at: "desc" },
    take: 200,
  });
  return NextResponse.json({ ok: true, orders });
}


