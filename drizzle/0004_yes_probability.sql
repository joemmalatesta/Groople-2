ALTER TABLE "answers" RENAME COLUMN "noul" TO "yes_probability";
--> statement-breakpoint
ALTER INDEX "answers_category_noul_idx" RENAME TO "answers_category_yes_probability_idx";
