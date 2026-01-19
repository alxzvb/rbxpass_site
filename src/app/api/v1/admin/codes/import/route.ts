import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeadersOrCookies, verifyAdminToken } from "@/lib/auth";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = getTokenFromHeadersOrCookies(request.headers);
  if (!verifyAdminToken(auth).ok) return new NextResponse("Unauthorized", { status: 401 });

  const contentType = request.headers.get("content-type") || "";
  const buffer = Buffer.from(await request.arrayBuffer());

  let rows: Array<{ code: string; nominal: number; status?: string; product_type?: string }> = [];
  const normalizeRecord = (record: Record<string, unknown>) => {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      const cleanKey = key.replace(/^\uFEFF/, "").trim();
      normalized[cleanKey] = value;
    }
    return normalized;
  };
  if (contentType.includes("text/csv") || contentType.includes("application/csv")) {
    const records = parse(buffer.toString("utf8"), { columns: true, skip_empty_lines: true }) as Record<string, unknown>[];
    rows = records.map((r) => {
      const normalized = normalizeRecord(r);
      return {
        code: String(normalized.code || "").toUpperCase(),
        nominal: Number(normalized.nominal) || 0,
        status: (normalized.status || "active").toString(),
        product_type: (normalized.product_type || normalized.productType || "roblox").toString(),
      };
    });
  } else if (contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") || contentType.includes("application/vnd.ms-excel")) {
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    rows = json.map((r) => {
      const normalized = normalizeRecord(r);
      return {
        code: String(normalized.code || "").toUpperCase(),
        nominal: Number(normalized.nominal) || 0,
        status: (normalized.status || "active").toString(),
        product_type: (normalized.product_type || normalized.productType || "roblox").toString(),
      };
    });
  } else {
    return new NextResponse("Unsupported Media Type", { status: 415 });
  }

  let created = 0;
  for (const row of rows) {
    if (!row.code || row.code.toLowerCase() === "undefined" || !row.nominal) continue;
    try {
      await prisma.legacyCode.upsert({
        where: { code: row.code },
        create: {
          code: row.code,
          nominal: row.nominal,
          status: row.status || "active",
          product_type: row.product_type || "roblox",
        },
        update: {
          nominal: row.nominal,
          status: row.status || "active",
          product_type: row.product_type || "roblox",
        },
      });
      created += 1;
    } catch {}
  }

  return NextResponse.json({ ok: true, imported: created });
}


