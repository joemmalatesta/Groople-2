CREATE TABLE "players" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"timezone" text,
	"last_played_on" date,
	"streak" integer DEFAULT 0 NOT NULL,
	"max_streak" integer DEFAULT 0 NOT NULL,
	"name" text,
	"metadata" text
);
--> statement-breakpoint
CREATE INDEX "players_last_played_on_idx" ON "players" USING btree ("last_played_on");
--> statement-breakpoint
CREATE UNIQUE INDEX "players_metadata_unique" ON "players" (lower(btrim("metadata")))
WHERE "metadata" IS NOT NULL AND btrim("metadata") <> '';
--> statement-breakpoint
INSERT INTO "players" ("id", "last_played_on", "created_at", "updated_at")
SELECT "player_id", MAX("date"), MIN("submitted_at"), MAX("submitted_at")
FROM "plays"
GROUP BY "player_id"
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "plays"
	ADD CONSTRAINT "plays_player_id_players_id_fk"
	FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "players" ENABLE ROW LEVEL SECURITY;
