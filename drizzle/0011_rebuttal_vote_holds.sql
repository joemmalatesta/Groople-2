ALTER TYPE "public"."rebuttal_vote" ADD VALUE 'pending';--> statement-breakpoint
ALTER TYPE "public"."rebuttal_vote" ADD VALUE 'skipped';--> statement-breakpoint
ALTER TABLE "rebuttal_votes" ADD COLUMN "day" date;--> statement-breakpoint
UPDATE "rebuttal_votes" SET "day" = ("created_at" AT TIME ZONE 'UTC')::date WHERE "day" IS NULL;--> statement-breakpoint
ALTER TABLE "rebuttal_votes" ALTER COLUMN "day" SET NOT NULL;--> statement-breakpoint
-- Compare as text so this statement does not use the new enum labels before they commit.
CREATE UNIQUE INDEX "rebuttal_votes_one_pending_per_day" ON "rebuttal_votes" USING btree ("player_id","day") WHERE "vote"::text = 'pending';
