CREATE TABLE "acnh_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"hemisphere" "hemisphere" NOT NULL,
	"month" integer NOT NULL,
	"hours_mask" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acnh_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" "category" NOT NULL,
	"original_name" varchar(120) NOT NULL,
	"name_ko" varchar(120) NOT NULL,
	"image_url" varchar(512) NOT NULL,
	"location" varchar(160),
	"sell_nook" integer,
	"raw" jsonb,
	"data_version" varchar(80),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acnh_availability" ADD CONSTRAINT "acnh_availability_item_id_acnh_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."acnh_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_item_hemi_month" ON "acnh_availability" USING btree ("item_id","hemisphere","month");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_cat_name" ON "acnh_items" USING btree ("category","original_name");