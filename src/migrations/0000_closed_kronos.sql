CREATE TYPE "public"."category" AS ENUM('fish', 'bug', 'sea', 'fossil');--> statement-breakpoint
CREATE TYPE "public"."hemisphere" AS ENUM('north', 'south');--> statement-breakpoint
CREATE TABLE "caught_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" "category" NOT NULL,
	"item_name" varchar(100) NOT NULL,
	"caught_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(30) NOT NULL,
	"hemisphere" "hemisphere" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "caught_items" ADD CONSTRAINT "caught_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_item_unique" ON "caught_items" USING btree ("user_id","category","item_name");