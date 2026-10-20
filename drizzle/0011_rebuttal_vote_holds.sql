COMMIT;--> statement-breakpoint
ALTER TYPE "public"."rebuttal_vote" ADD VALUE IF NOT EXISTS 'pending';--> statement-breakpoint
ALTER TYPE "public"."rebuttal_vote" ADD VALUE IF NOT EXISTS 'skipped';--> statement-breakpoint
BEGIN;--> statement-breakpoint
ALTER TABLE "rebuttal_votes" ADD COLUMN IF NOT EXISTS "day" date;--> statement-breakpoint
UPDATE "rebuttal_votes" SET "day" = ("created_at" AT TIME ZONE 'UTC')::date WHERE "day" IS NULL;--> statement-breakpoint
ALTER TABLE "rebuttal_votes" ALTER COLUMN "day" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rebuttal_votes_one_pending_per_day" ON "rebuttal_votes" USING btree ("player_id","day") WHERE "rebuttal_votes"."vote" = 'pending';
