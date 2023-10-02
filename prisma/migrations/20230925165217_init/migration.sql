-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_auth_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "about" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_auth_user" ("about", "email", "id", "isAdmin", "name", "username") SELECT "about", "email", "id", "isAdmin", "name", "username" FROM "auth_user";
DROP TABLE "auth_user";
ALTER TABLE "new_auth_user" RENAME TO "auth_user";
CREATE UNIQUE INDEX "auth_user_username_key" ON "auth_user"("username");
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
