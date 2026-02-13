-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "parentRecipeId" TEXT,
    "rating" REAL,
    "photo_hash" TEXT,
    "on_favorites" BOOLEAN DEFAULT false,
    "photo" TEXT,
    "scale" TEXT,
    "ingredients" TEXT,
    "ingredients_original" TEXT,
    "is_pinned" BOOLEAN DEFAULT false,
    "is_public" BOOLEAN DEFAULT false,
    "source" TEXT,
    "total_time" TEXT,
    "hash" TEXT,
    "description" TEXT,
    "source_url" TEXT,
    "difficulty" TEXT,
    "on_grocery_list" BOOLEAN DEFAULT false,
    "in_trash" BOOLEAN DEFAULT false,
    "directions" TEXT,
    "directions_original" TEXT,
    "photo_url" TEXT,
    "cook_time" TEXT,
    "name" TEXT,
    "created" DATETIME NOT NULL,
    "notes" TEXT,
    "photo_large" TEXT,
    "image_url" TEXT,
    "prep_time" TEXT,
    "servings" TEXT,
    "nutritional_info" TEXT,
    "embedding" BLOB,
    "embeddingModel" TEXT,
    "embeddingVersion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recipe_parentRecipeId_fkey" FOREIGN KEY ("parentRecipeId") REFERENCES "Recipe" ("uid") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("cook_time", "created", "description", "difficulty", "directions", "directions_original", "hash", "image_url", "in_trash", "ingredients", "ingredients_original", "is_pinned", "is_public", "name", "notes", "nutritional_info", "on_favorites", "on_grocery_list", "parentRecipeId", "photo", "photo_hash", "photo_large", "photo_url", "prep_time", "rating", "scale", "servings", "source", "source_url", "total_time", "uid", "userId") SELECT "cook_time", "created", "description", "difficulty", "directions", "directions_original", "hash", "image_url", "in_trash", "ingredients", "ingredients_original", "is_pinned", "is_public", "name", "notes", "nutritional_info", "on_favorites", "on_grocery_list", "parentRecipeId", "photo", "photo_hash", "photo_large", "photo_url", "prep_time", "rating", "scale", "servings", "source", "source_url", "total_time", "uid", "userId" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE TABLE "new_SiteSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "version" REAL NOT NULL DEFAULT 0,
    "registrationAllowed" BOOLEAN NOT NULL DEFAULT false,
    "oidcAutoProvision" BOOLEAN NOT NULL DEFAULT true,
    "requireLogin" BOOLEAN NOT NULL DEFAULT false,
    "llmEnabled" BOOLEAN NOT NULL DEFAULT false,
    "llmProvider" TEXT,
    "llmTextModel" TEXT,
    "llmImageModel" TEXT,
    "semanticEnabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_SiteSettings" ("id", "llmEnabled", "llmImageModel", "llmProvider", "llmTextModel", "oidcAutoProvision", "registrationAllowed", "requireLogin", "version") SELECT "id", "llmEnabled", "llmImageModel", "llmProvider", "llmTextModel", "oidcAutoProvision", "registrationAllowed", "requireLogin", "version" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
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
