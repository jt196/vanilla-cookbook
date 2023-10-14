/*
  Warnings:

  - You are about to alter the column `version` on the `SiteSettings` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" REAL NOT NULL DEFAULT 0,
    "registrationAllowed" BOOLEAN NOT NULL
);
INSERT INTO "new_SiteSettings" ("id", "registrationAllowed", "version") SELECT "id", "registrationAllowed", "version" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
