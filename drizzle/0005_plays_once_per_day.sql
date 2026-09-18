DELETE FROM "answers"
WHERE "play_id" NOT IN (
	SELECT DISTINCT ON ("player_id", "date") "id"
	FROM "plays"
	ORDER BY "player_id", "date", "submitted_at" DESC, "id" DESC
);
--> statement-breakpoint
DELETE FROM "plays"
WHERE "id" NOT IN (
	SELECT DISTINCT ON ("player_id", "date") "id"
	FROM "plays"
	ORDER BY "player_id", "date", "submitted_at" DESC, "id" DESC
);
--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_player_date_unique" UNIQUE ("player_id", "date");
