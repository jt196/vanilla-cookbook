-- CreateTable
CREATE TABLE "RecipeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeUid" TEXT NOT NULL,
    "cooked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecipeLog_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE CASCADE ON UPDATE CASCADE
);
