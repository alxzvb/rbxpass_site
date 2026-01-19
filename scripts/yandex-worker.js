const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const YANDEX_OAUTH_TOKEN = process.env.YANDEX_OAUTH_TOKEN;
const YANDEX_CAMPAIGN_ID = process.env.YANDEX_CAMPAIGN_ID;
const YANDEX_BUSINESS_ID = process.env.YANDEX_BUSINESS_ID;

const YANDEX_API_BASE = "https://api.partner.market.yandex.ru";

async function fetchYandexOrder(orderId) {
  if (!YANDEX_OAUTH_TOKEN || !YANDEX_BUSINESS_ID) {
    throw new Error("Missing Yandex credentials");
  }

  const url = `${YANDEX_API_BASE}/campaigns/${YANDEX_CAMPAIGN_ID}/orders/${orderId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `OAuth ${YANDEX_OAUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Yandex API error: ${response.status} ${text}`);
  }

  return response.json();
}

async function deliverDigitalGoods(orderId, itemId, codeText) {
  if (!YANDEX_OAUTH_TOKEN || !YANDEX_CAMPAIGN_ID) {
    throw new Error("Missing Yandex credentials");
  }

  const url = `${YANDEX_API_BASE}/campaigns/${YANDEX_CAMPAIGN_ID}/orders/${orderId}/deliverDigitalGoods`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${YANDEX_OAUTH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          itemId,
          digitalCodes: [codeText],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Delivery API error: ${response.status} ${text}`);
  }

  return response.json();
}

async function processEvent(event) {
  try {
    console.log(`[${new Date().toISOString()}] Processing event ${event.id} (orderId: ${event.orderId}, type: ${event.type})`);

    // Skip if already processed
    if (event.processedAt) {
      console.log(`  Event ${event.id} already processed, skipping`);
      return;
    }

    // Fetch order from Yandex
    const orderData = await fetchYandexOrder(event.orderId);
    const order = orderData.result?.order;

    if (!order) {
      console.error(`  Order ${event.orderId} not found in Yandex`);
      await prisma.yandexEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      return;
    }

    // Check if order is digital and in correct status
    const isDigital = order.items?.some((item) => item.type === "DIGITAL");
    if (!isDigital) {
      console.log(`  Order ${event.orderId} is not digital, skipping`);
      await prisma.yandexEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      return;
    }

    const status = order.status;
    if (status !== "PROCESSING" && status !== "DELIVERY" && status !== "PICKUP") {
      console.log(`  Order ${event.orderId} status is ${status}, skipping`);
      await prisma.yandexEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });
      return;
    }

    // Process each digital item
    for (const item of order.items || []) {
      if (item.type !== "DIGITAL") continue;

      const itemId = String(item.id);
      const offerId = String(item.offerId || "");

      // Check if already delivered
      const existingLog = await prisma.deliveryLog.findUnique({
        where: {
          orderId_itemId: {
            orderId: event.orderId,
            itemId,
          },
        },
      });

      if (existingLog) {
        console.log(`  Item ${itemId} already delivered, skipping`);
        continue;
      }

      // Find product mapping
      const offerMap = await prisma.offerMap.findUnique({
        where: { offerId },
        include: { product: true },
      });

      if (!offerMap) {
        console.error(`  No offerMap found for offerId: ${offerId}`);
        continue;
      }

      const quantity = item.count || 1;

      // Reserve codes atomically
      const codes = await prisma.$transaction(async (tx) => {
        const available = await tx.code.findMany({
          where: {
            productId: offerMap.productId,
            status: "available",
          },
          take: quantity,
        });

        if (available.length < quantity) {
          throw new Error(`Insufficient codes: need ${quantity}, have ${available.length}`);
        }

        const reserved = await Promise.all(
          available.map((code) =>
            tx.code.update({
              where: { id: code.id },
              data: {
                status: "reserved",
                orderId: event.orderId,
                itemId,
                reservedAt: new Date(),
              },
            })
          )
        );

        return reserved;
      });

      if (codes.length === 0) {
        console.error(`  No codes available for product ${offerMap.productId}`);
        continue;
      }

      // Deliver codes to Yandex
      try {
        const codeTexts = codes.map((c) => c.codeText);
        await deliverDigitalGoods(event.orderId, itemId, codeTexts[0]); // Yandex expects single code per item

        // Mark as delivered
        await prisma.$transaction(async (tx) => {
          for (const code of codes) {
            await tx.code.update({
              where: { id: code.id },
              data: {
                status: "delivered",
                deliveredAt: new Date(),
              },
            });
          }

          await tx.deliveryLog.create({
            data: {
              orderId: event.orderId,
              itemId,
              codeId: codes[0].id,
            },
          });
        });

        console.log(`  ✅ Delivered ${codes.length} code(s) for item ${itemId}`);
      } catch (deliveryError) {
        console.error(`  ❌ Delivery failed for item ${itemId}:`, deliveryError.message);
        // Release reserved codes on error
        await prisma.code.updateMany({
          where: {
            id: { in: codes.map((c) => c.id) },
            status: "reserved",
          },
          data: {
            status: "available",
            orderId: null,
            itemId: null,
            reservedAt: null,
          },
        });
      }
    }

    // Mark event as processed
    await prisma.yandexEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    });

    console.log(`  ✅ Event ${event.id} processed successfully`);
  } catch (error) {
    console.error(`  ❌ Error processing event ${event.id}:`, error.message);
    // Don't mark as processed on error, so it can be retried
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Yandex worker started`);

  while (true) {
    try {
      // Fetch unprocessed events
      const events = await prisma.yandexEvent.findMany({
        where: {
          processedAt: null,
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 10,
      });

      if (events.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }

      for (const event of events) {
        await processEvent(event);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Worker error:", error);
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
