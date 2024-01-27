/*
  Warnings:

  - The primary key for the `ShoppingListItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ShoppingListItem` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `ShoppingListItem` table. The data in that column could be lost. The data in that column will be cast from `String` to `Float`.
  - The required column `uid` was added to the `ShoppingListItem` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShoppingListItem" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "purchased" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ShoppingListItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShoppingListItem" ("name", "purchased", "quantity", "userId") SELECT "name", "purchased", "quantity", "userId" FROM "ShoppingListItem";
DROP TABLE "ShoppingListItem";
ALTER TABLE "new_ShoppingListItem" RENAME TO "ShoppingListItem";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
