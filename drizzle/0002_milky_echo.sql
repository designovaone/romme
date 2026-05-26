ALTER TABLE "matches" ADD COLUMN "start_joker" smallint;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "left_jokers" smallint;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "right_jokers" smallint;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_start_joker_chk" CHECK ("matches"."start_joker" IN (0, 1));--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_left_jokers_chk" CHECK ("matches"."left_jokers" >= 0 AND "matches"."left_jokers" <= 99);--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_right_jokers_chk" CHECK ("matches"."right_jokers" >= 0 AND "matches"."right_jokers" <= 99);