-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" REAL NOT NULL DEFAULT 0,
    "registrationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "oidcAutoProvision" BOOLEAN NOT NULL DEFAULT true,
    "requireLogin" BOOLEAN NOT NULL DEFAULT false,
    "llmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "llmProvider" TEXT,
    "llmTextModel" TEXT,
    "llmImageModel" TEXT
);
INSERT INTO "new_SiteSettings" ("id", "llmEnabled", "llmImageModel", "llmProvider", "llmTextModel", "registrationAllowed", "requireLogin", "version") SELECT "id", "llmEnabled", "llmImageModel", "llmProvider", "llmTextModel", "registrationAllowed", "requireLogin", "version" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
