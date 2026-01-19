import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdminRequest(request.headers)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const logs = await prisma.deliveryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        code: {
          include: {
            product: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, logs });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
