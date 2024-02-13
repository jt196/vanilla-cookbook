/*
  Warnings:

  - Added the required column `userId` to the `RecipeLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecipeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeUid" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cooked" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecipeLog_recipeUid_fkey" FOREIGN KEY ("recipeUid") REFERENCES "Recipe" ("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecipeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RecipeLog" ("cooked", "id", "recipeUid") SELECT "cooked", "id", "recipeUid" FROM "RecipeLog";
DROP TABLE "RecipeLog";
ALTER TABLE "new_RecipeLog" RENAME TO "RecipeLog";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
