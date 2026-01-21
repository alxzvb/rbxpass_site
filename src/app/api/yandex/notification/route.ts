import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  return NextResponse.json({
    name: "RBXPASS",
    version: 1,
    status: "OK",
    time: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    let payload: unknown;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await request.json();
    } else {
      // PING requests might not have Content-Type
      const text = await request.text();
      if (text.trim() === "" || text === "{}") {
        // PING request
        return NextResponse.json({
          name: "RBXPASS",
          version: 1,
          status: "OK",
          time: new Date().toISOString(),
        });
      }
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    // Handle PING notifications
    if (typeof payload === "object" && payload !== null && "event" in payload) {
      const event = (payload as { event?: string }).event;
      if (event === "PING") {
        return NextResponse.json({
          name: "RBXPASS",
          version: 1,
          status: "OK",
          time: new Date().toISOString(),
        });
      }
    }

    // Extract order information
    const orderId = typeof payload === "object" && payload !== null && "order" in payload
      ? String((payload as { order?: { id?: string } }).order?.id || "")
      : "";

    const eventType = typeof payload === "object" && payload !== null && "event" in payload
      ? String((payload as { event?: string }).event || "")
      : "unknown";

    const eventTime = typeof payload === "object" && payload !== null && "updateTime" in payload
      ? new Date(String((payload as { updateTime?: string }).updateTime || new Date()))
      : new Date();

    if (!orderId || !eventType) {
      return NextResponse.json({ ok: true, message: "Skipped: no orderId or eventType" });
    }

    // Idempotency check
    const existing = await prisma.yandexEvent.findUnique({
      where: {
        orderId_type_eventTime: {
          orderId,
          type: eventType,
          eventTime,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ ok: true, message: "Already processed" });
    }

    // Store event
    await prisma.yandexEvent.create({
      data: {
        orderId,
        type: eventType,
        eventTime,
        payloadJson: JSON.parse(JSON.stringify(payload)),
      },
    });

    return NextResponse.json({ ok: true, message: "Event stored" });
  } catch (error) {
    console.error("Yandex webhook error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
