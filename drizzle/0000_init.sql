CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"left_player_id" uuid NOT NULL,
	"right_player_id" uuid NOT NULL,
	"round_count" smallint NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	CONSTRAINT "matches_round_count_chk" CHECK ("matches"."round_count" IN (3, 5, 10)),
	CONSTRAINT "matches_status_chk" CHECK ("matches"."status" IN ('in_progress', 'complete')),
	CONSTRAINT "matches_distinct_players_chk" CHECK ("matches"."left_player_id" <> "matches"."right_player_id")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"round_number" smallint NOT NULL,
	"left_points" integer NOT NULL,
	"right_points" integer NOT NULL,
	"winner" smallint NOT NULL,
	"dealer" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rounds_left_points_chk" CHECK ("rounds"."left_points" >= 0 AND "rounds"."left_points" <= 500),
	CONSTRAINT "rounds_right_points_chk" CHECK ("rounds"."right_points" >= 0 AND "rounds"."right_points" <= 500),
	CONSTRAINT "rounds_winner_chk" CHECK ("rounds"."winner" IN (0, 1)),
	CONSTRAINT "rounds_dealer_chk" CHECK ("rounds"."dealer" IN (0, 1))
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_left_player_id_players_id_fk" FOREIGN KEY ("left_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_right_player_id_players_id_fk" FOREIGN KEY ("right_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_played_at_idx" ON "matches" USING btree ("played_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "rounds_match_round_uniq" ON "rounds" USING btree ("match_id","round_number");--> statement-breakpoint
CREATE INDEX "rounds_match_idx" ON "rounds" USING btree ("match_id");--> statement-breakpoint
INSERT INTO "players" ("name") VALUES ('Richard') ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
INSERT INTO "players" ("name") VALUES ('Andrea') ON CONFLICT ("name") DO NOTHING;