CREATE TABLE "daily_letters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"letter" text NOT NULL,
	CONSTRAINT "daily_letters_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE INDEX "daily_letters_id_idx" ON "daily_letters" USING btree ("id");--> statement-breakpoint
CREATE INDEX "daily_letters_date_idx" ON "daily_letters" USING btree ("date");