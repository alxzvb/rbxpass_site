import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) return new NextResponse("Unauthorized", { status: 401 });

  const params = await context.params;
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Bad Request", { status: 400 });

  const body = await request.json().catch(() => ({}));
  const status = body?.status as string | undefined;
  if (!status) return new NextResponse("Bad Request", { status: 400 });

  const updated = await prisma.order.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true, order: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) return new NextResponse("Unauthorized", { status: 401 });

  const params = await context.params;
  const id = Number(params.id);
  if (!Number.isFinite(id)) return new NextResponse("Bad Request", { status: 400 });

  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


