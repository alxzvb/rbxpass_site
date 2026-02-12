import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const short = (searchParams.get("code") ?? "").toUpperCase().trim();
  const nickname = (searchParams.get("nickname") ?? "").trim();

  if (!short && !nickname) {
    return NextResponse.json({ ok: false, error: "code or nickname required" }, { status: 400 });
  }

  const order = short
    ? await prisma.order.findFirst({ where: { short_code: short } })
    : await prisma.order.findFirst({
        where: { nickname: { contains: nickname } },
        orderBy: { created_at: "desc" },
      });

  if (!order) {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    order: {
      short_code: order.short_code,
      nickname: order.nickname,
      status: order.status,
      created_at: order.created_at,
    },
    lookupBy: short ? "code" : "nickname",
  });
}
