/*
  Warnings:

  - You are about to drop the `Article` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Article";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "order_flag" INTEGER,
    "parent_uid" TEXT,
    "name" TEXT,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Category_parent_uid_fkey" FOREIGN KEY ("parent_uid") REFERENCES "Category" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("name", "order_flag", "parent_uid", "uid", "userId") SELECT "name", "order_flag", "parent_uid", "uid", "userId" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_ShoppingListItem" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "recipeUid" TEXT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL,
    "unit" TEXT,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShoppingListItem_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ShoppingListItem" ("createdAt", "name", "purchased", "quantity", "recipeUid", "uid", "unit", "userId") SELECT "createdAt", "name", "purchased", "quantity", "recipeUid", "uid", "unit", "userId" FROM "ShoppingListItem";
DROP TABLE "ShoppingListItem";
ALTER TABLE "new_ShoppingListItem" RENAME TO "ShoppingListItem";
CREATE TABLE "new_RecipeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeUid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cooked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cookedEnd" DATETIME,
    CONSTRAINT "RecipeLog_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RecipeLog" ("cooked", "cookedEnd", "id", "recipeUid", "userId") SELECT "cooked", "cookedEnd", "id", "recipeUid", "userId" FROM "RecipeLog";
DROP TABLE "RecipeLog";
ALTER TABLE "new_RecipeLog" RENAME TO "RecipeLog";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
