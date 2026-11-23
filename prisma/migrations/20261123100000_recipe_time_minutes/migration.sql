-- Recipe times in whole minutes, parsed from prep_time/cook_time/total_time (see src/lib/utils/recipeTime.js).
-- Existing rows are filled in by the backfill that runs with the seed step.
ALTER TABLE "Recipe" ADD COLUMN "prep_minutes" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "cook_minutes" INTEGER;
ALTER TABLE "Recipe" ADD COLUMN "total_minutes" INTEGER;
