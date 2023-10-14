-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "registrationAllowed" BOOLEAN NOT NULL
);
INSERT INTO "new_SiteSettings" ("id", "registrationAllowed") SELECT "id", "registrationAllowed" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
