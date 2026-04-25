CREATE TYPE "public"."game_result" AS ENUM('W', 'L', 'T');--> statement-breakpoint
CREATE TYPE "public"."game_status" AS ENUM('scheduled', 'final', 'historical', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F');--> statement-breakpoint
CREATE TYPE "public"."rsvp_status" AS ENUM('yes', 'no', 'maybe');--> statement-breakpoint
CREATE TYPE "public"."stat_source" AS ENUM('xlsx', 'manual', 'ocr');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('pending', 'parsed', 'committed', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batting_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"ab" integer DEFAULT 0 NOT NULL,
	"r" integer DEFAULT 0 NOT NULL,
	"h" integer DEFAULT 0 NOT NULL,
	"singles" integer DEFAULT 0 NOT NULL,
	"doubles" integer DEFAULT 0 NOT NULL,
	"triples" integer DEFAULT 0 NOT NULL,
	"hr" integer DEFAULT 0 NOT NULL,
	"rbi" integer DEFAULT 0 NOT NULL,
	"bb" integer DEFAULT 0 NOT NULL,
	"k" integer DEFAULT 0 NOT NULL,
	"sac" integer DEFAULT 0 NOT NULL,
	"source" "stat_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "batting_lines_h_check" CHECK ("batting_lines"."h" = "batting_lines"."singles" + "batting_lines"."doubles" + "batting_lines"."triples" + "batting_lines"."hr"),
	CONSTRAINT "batting_lines_ab_check" CHECK ("batting_lines"."ab" >= "batting_lines"."h" + "batting_lines"."k")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"game_number" integer,
	"played_on" date NOT NULL,
	"start_time" timestamp with time zone,
	"location" text,
	"opponent" text,
	"uhj_runs" integer,
	"opp_runs" integer,
	"result" "game_result",
	"status" "game_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"ical_uid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_ical_uid_unique" UNIQUE("ical_uid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "player_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"alias" text NOT NULL,
	CONSTRAINT "player_aliases_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"gender" "gender" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"jersey_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "players_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"status" "rsvp_status" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoresheet_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid,
	"storage_key" text NOT NULL,
	"parsed_json" jsonb,
	"status" "upload_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"label" text NOT NULL,
	"ical_url" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seasons_year_unique" UNIQUE("year")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batting_lines" ADD CONSTRAINT "batting_lines_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "games" ADD CONSTRAINT "games_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "player_aliases" ADD CONSTRAINT "player_aliases_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scoresheet_uploads" ADD CONSTRAINT "scoresheet_uploads_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "batting_lines_game_player" ON "batting_lines" USING btree ("game_id","player_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_season" ON "games" USING btree ("season_id","played_on");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rsvps_game_player" ON "rsvps" USING btree ("game_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "seasons_one_current" ON "seasons" USING btree ("is_current") WHERE "seasons"."is_current" = true;