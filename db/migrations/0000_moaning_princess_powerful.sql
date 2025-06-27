CREATE TABLE IF NOT EXISTS "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"prompt_img" text NOT NULL,
	"model_answer_json" jsonb NOT NULL,
	"marks" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_answer_images" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"img_key" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_answer_images" ADD CONSTRAINT "model_answer_images_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
