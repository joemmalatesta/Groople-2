ALTER TABLE "plays" DROP COLUMN IF EXISTS "share_count";
--> statement-breakpoint
ALTER TABLE "plays" ADD COLUMN IF NOT EXISTS "shared" boolean DEFAULT false NOT NULL;
