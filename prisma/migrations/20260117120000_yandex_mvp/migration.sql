-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "productKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OfferMap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "offerId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "OfferMap_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "codeText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "orderId" TEXT,
    "itemId" TEXT,
    "reservedAt" DATETIME,
    "deliveredAt" DATETIME,
    CONSTRAINT "StockCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "YandexEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "eventTime" DATETIME NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DeliveryLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "codeId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryLog_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "StockCode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_productKey_key" ON "Product"("productKey");

-- CreateIndex
CREATE UNIQUE INDEX "OfferMap_offerId_key" ON "OfferMap"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "StockCode_codeText_key" ON "StockCode"("codeText");

-- CreateIndex
CREATE UNIQUE INDEX "YandexEvent_orderId_type_eventTime_key" ON "YandexEvent"("orderId", "type", "eventTime");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryLog_orderId_itemId_key" ON "DeliveryLog"("orderId", "itemId");



