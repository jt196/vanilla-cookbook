-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rating" REAL,
    "photo_hash" TEXT,
    "on_favorites" BOOLEAN DEFAULT false,
    "photo" TEXT,
    "scale" TEXT,
    "ingredients" TEXT,
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
    CONSTRAINT "Recipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("cook_time", "created", "description", "difficulty", "directions", "hash", "image_url", "in_trash", "ingredients", "is_pinned", "is_public", "name", "notes", "nutritional_info", "on_favorites", "on_grocery_list", "photo", "photo_hash", "photo_large", "photo_url", "prep_time", "rating", "scale", "servings", "source", "source_url", "total_time", "uid", "userId") SELECT "cook_time", "created", "description", "difficulty", "directions", "hash", "image_url", "in_trash", "ingredients", "is_pinned", "is_public", "name", "notes", "nutritional_info", "on_favorites", "on_grocery_list", "photo", "photo_hash", "photo_large", "photo_url", "prep_time", "rating", "scale", "servings", "source", "source_url", "total_time", "uid", "userId" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
