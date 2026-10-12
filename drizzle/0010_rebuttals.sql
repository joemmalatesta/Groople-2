CREATE TYPE "public"."rebuttal_status" AS ENUM('open', 'yes', 'no');--> statement-breakpoint
CREATE TYPE "public"."rebuttal_vote" AS ENUM('yes', 'no');--> statement-breakpoint
CREATE TABLE "rebuttal_votes" (
	"rebuttal_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"vote" "rebuttal_vote" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rebuttal_votes_rebuttal_id_player_id_pk" PRIMARY KEY("rebuttal_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "rebuttals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"answer_id" uuid NOT NULL,
	"author_player_id" uuid NOT NULL,
	"puzzle_date" date NOT NULL,
	"status" "rebuttal_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "rebuttals_answer_id_unique" UNIQUE("answer_id")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD COLUMN "profane_probability" real;--> statement-breakpoint
ALTER TABLE "rebuttal_votes" ADD CONSTRAINT "rebuttal_votes_rebuttal_id_rebuttals_id_fk" FOREIGN KEY ("rebuttal_id") REFERENCES "public"."rebuttals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttal_votes" ADD CONSTRAINT "rebuttal_votes_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttals" ADD CONSTRAINT "rebuttals_answer_id_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttals" ADD CONSTRAINT "rebuttals_author_player_id_players_id_fk" FOREIGN KEY ("author_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rebuttals" ADD CONSTRAINT "rebuttals_puzzle_date_daily_puzzles_date_fk" FOREIGN KEY ("puzzle_date") REFERENCES "public"."daily_puzzles"("date") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rebuttals_status_puzzle_date_idx" ON "rebuttals" USING btree ("status","puzzle_date");--> statement-breakpoint
CREATE INDEX "rebuttals_author_player_id_idx" ON "rebuttals" USING btree ("author_player_id");