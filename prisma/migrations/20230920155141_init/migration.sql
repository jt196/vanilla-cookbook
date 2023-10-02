-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rating" REAL,
    "photo_hash" TEXT,
    "on_favorites" BOOLEAN,
    "photo" TEXT,
    "scale" TEXT,
    "ingredients" TEXT,
    "is_pinned" BOOLEAN,
    "source" TEXT,
    "total_time" TEXT,
    "hash" TEXT,
    "description" TEXT,
    "source_url" TEXT,
    "difficulty" TEXT,
    "on_grocery_list" BOOLEAN,
    "in_trash" BOOLEAN,
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

-- CreateTable
CREATE TABLE "RecipePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeUid" TEXT NOT NULL,
    "url" TEXT,
    "fileType" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    CONSTRAINT "RecipePhoto_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "order_flag" INTEGER,
    "parent_uid" TEXT,
    "name" TEXT,
    CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Category_parent_uid_fkey" FOREIGN KEY ("parent_uid") REFERENCES "Category" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecipeCategory" (
    "recipeUid" TEXT NOT NULL,
    "categoryUid" TEXT NOT NULL,

    PRIMARY KEY ("recipeUid", "categoryUid"),
    CONSTRAINT "RecipeCategory_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeCategory_categoryUid_fkey" FOREIGN KEY ("categoryUid") REFERENCES "Category" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "auth_session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "active_expires" BIGINT NOT NULL,
    "idle_expires" BIGINT NOT NULL,
    CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_key" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hashed_password" TEXT,
    "user_id" TEXT NOT NULL,
    "primary_key" BOOLEAN NOT NULL,
    "expires" BIGINT,
    CONSTRAINT "auth_key_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_user_username_key" ON "auth_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_id_key" ON "auth_session"("id");

-- CreateIndex
CREATE INDEX "auth_session_user_id_idx" ON "auth_session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_key_id_key" ON "auth_key"("id");

-- CreateIndex
CREATE INDEX "auth_key_user_id_idx" ON "auth_key"("user_id");
