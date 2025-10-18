CREATE TABLE "daily_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"category_id" uuid NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "daily_categories_date_order_unique" UNIQUE("date","order")
);
--> statement-breakpoint
ALTER TABLE "daily_categories" ADD CONSTRAINT "daily_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_categories_id_idx" ON "daily_categories" USING btree ("id");--> statement-breakpoint
CREATE INDEX "daily_categories_date_idx" ON "daily_categories" USING btree ("date");