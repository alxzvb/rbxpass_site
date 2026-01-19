import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdminRequest(request.headers)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      include: {
        codes: {
          select: { status: true },
        },
      },
    });

    const stock = products.map((product) => {
      const available = product.codes.filter((c) => c.status === "available").length;
      const reserved = product.codes.filter((c) => c.status === "reserved").length;
      const delivered = product.codes.filter((c) => c.status === "delivered").length;
      return {
        productId: product.id,
        title: product.title,
        productKey: product.productKey,
        available,
        reserved,
        delivered,
        total: product.codes.length,
      };
    });

    return NextResponse.json({ ok: true, stock });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
