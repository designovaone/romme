ALTER TABLE "matches" DROP CONSTRAINT "matches_left_jokers_chk";--> statement-breakpoint
ALTER TABLE "matches" DROP CONSTRAINT "matches_right_jokers_chk";--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "left_jokers" smallint;--> statement-breakpoint
ALTER TABLE "rounds" ADD COLUMN "right_jokers" smallint;--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "left_jokers";--> statement-breakpoint
ALTER TABLE "matches" DROP COLUMN "right_jokers";--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_left_jokers_chk" CHECK ("rounds"."left_jokers" >= 0 AND "rounds"."left_jokers" <= 99);--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_right_jokers_chk" CHECK ("rounds"."right_jokers" >= 0 AND "rounds"."right_jokers" <= 99);