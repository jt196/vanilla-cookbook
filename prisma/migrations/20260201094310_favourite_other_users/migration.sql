/*
  Warnings:

  - You are about to drop the column `name` on the `auth_user` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "RecipeFavorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recipeUid" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecipeFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeFavorite_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "about" TEXT,
    "units" TEXT DEFAULT 'metric',
    "language" TEXT NOT NULL DEFAULT 'eng',
    "theme" TEXT NOT NULL DEFAULT 'dracula',
    "publicProfile" BOOLEAN NOT NULL DEFAULT false,
    "publicRecipes" BOOLEAN NOT NULL DEFAULT false,
    "skipSmallUnits" BOOLEAN NOT NULL DEFAULT true,
    "ingSymbol" BOOLEAN NOT NULL DEFAULT true,
    "ingMatch" BOOLEAN NOT NULL DEFAULT false,
    "ingOriginal" BOOLEAN NOT NULL DEFAULT false,
    "ingExtra" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isRoot" BOOLEAN NOT NULL DEFAULT false,
    "useCats" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_auth_user" ("about", "email", "id", "ingExtra", "ingMatch", "ingOriginal", "ingSymbol", "isAdmin", "isRoot", "language", "publicProfile", "publicRecipes", "skipSmallUnits", "theme", "units", "useCats", "username") SELECT "about", "email", "id", "ingExtra", "ingMatch", "ingOriginal", "ingSymbol", "isAdmin", "isRoot", "language", "publicProfile", "publicRecipes", "skipSmallUnits", "theme", "units", "useCats", "username" FROM "auth_user";
DROP TABLE "auth_user";
ALTER TABLE "new_auth_user" RENAME TO "auth_user";
CREATE UNIQUE INDEX "auth_user_username_key" ON "auth_user"("username");
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "RecipeFavorite_userId_recipeUid_key" ON "RecipeFavorite"("userId", "recipeUid");
