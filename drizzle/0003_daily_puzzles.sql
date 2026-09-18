-- Categories catalog: rename prompt text, add archive flag
ALTER TABLE "categories" RENAME COLUMN "category" TO "name";
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "archived" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_unique";
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE ("name");
--> statement-breakpoint
DROP INDEX IF EXISTS "categories_id_idx";
--> statement-breakpoint

-- Old daily board and unused play tables
DROP TABLE IF EXISTS "answers";
--> statement-breakpoint
DROP TABLE IF EXISTS "plays";
--> statement-breakpoint
DROP TABLE IF EXISTS "daily_categories";
--> statement-breakpoint
DROP TABLE IF EXISTS "daily_letters";
--> statement-breakpoint

CREATE TABLE "daily_puzzles" (
	"date" date PRIMARY KEY NOT NULL,
	"letter" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "daily_puzzles_letter_idx" ON "daily_puzzles" USING btree ("letter");
--> statement-breakpoint

CREATE TABLE "daily_puzzle_slots" (
	"date" date NOT NULL,
	"position" smallint NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "daily_puzzle_slots_date_position_pk" PRIMARY KEY ("date", "position"),
	CONSTRAINT "daily_puzzle_slots_date_category_unique" UNIQUE ("date", "category_id")
);
--> statement-breakpoint
ALTER TABLE "daily_puzzle_slots"
	ADD CONSTRAINT "daily_puzzle_slots_date_daily_puzzles_date_fk"
	FOREIGN KEY ("date") REFERENCES "daily_puzzles"("date") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "daily_puzzle_slots"
	ADD CONSTRAINT "daily_puzzle_slots_category_id_categories_id_fk"
	FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "plays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"player_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"time_remaining_ms" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plays"
	ADD CONSTRAINT "plays_date_daily_puzzles_date_fk"
	FOREIGN KEY ("date") REFERENCES "daily_puzzles"("date") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "plays_player_submitted_idx" ON "plays" USING btree ("player_id", "submitted_at");
--> statement-breakpoint
CREATE INDEX "plays_date_idx" ON "plays" USING btree ("date");
--> statement-breakpoint

CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"play_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"category_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"correct" boolean NOT NULL,
	"noul" real,
	"rebuttaled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "answers_play_position_unique" UNIQUE ("play_id", "position")
);
--> statement-breakpoint
ALTER TABLE "answers"
	ADD CONSTRAINT "answers_play_id_plays_id_fk"
	FOREIGN KEY ("play_id") REFERENCES "plays"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "answers"
	ADD CONSTRAINT "answers_category_id_categories_id_fk"
	FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "answers_category_id_idx" ON "answers" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX "answers_category_noul_idx" ON "answers" USING btree ("category_id", "noul");
--> statement-breakpoint

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "daily_puzzles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "daily_puzzle_slots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "plays" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "answers" ENABLE ROW LEVEL SECURITY;
