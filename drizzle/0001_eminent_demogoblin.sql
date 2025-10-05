CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "user" CASCADE;--> statement-breakpoint
CREATE INDEX "categories_id_idx" ON "categories" USING btree ("id");