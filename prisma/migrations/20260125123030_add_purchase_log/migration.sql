-- CreateTable
CREATE TABLE "PurchaseLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "shoppingItemUid" TEXT,
    "itemName" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseLog_shoppingItemUid_fkey" FOREIGN KEY ("shoppingItemUid") REFERENCES "ShoppingListItem" ("uid") ON DELETE SET NULL ON UPDATE CASCADE
);
