-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "about" TEXT,
    "units" TEXT DEFAULT 'metric',
    "language" TEXT NOT NULL DEFAULT 'eng',
    "theme" TEXT NOT NULL DEFAULT 'dark',
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
INSERT INTO "new_auth_user" ("about", "email", "id", "ingExtra", "ingMatch", "ingOriginal", "ingSymbol", "isAdmin", "isRoot", "language", "name", "publicProfile", "publicRecipes", "skipSmallUnits", "theme", "units", "useCats", "username") SELECT "about", "email", "id", "ingExtra", "ingMatch", "ingOriginal", "ingSymbol", "isAdmin", "isRoot", "language", "name", "publicProfile", "publicRecipes", "skipSmallUnits", "theme", "units", "useCats", "username" FROM "auth_user";
DROP TABLE "auth_user";
ALTER TABLE "new_auth_user" RENAME TO "auth_user";
CREATE UNIQUE INDEX "auth_user_username_key" ON "auth_user"("username");
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
