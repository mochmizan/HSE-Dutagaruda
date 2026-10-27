CREATE TABLE "project_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
