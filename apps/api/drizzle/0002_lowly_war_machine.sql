ALTER TABLE "apar_inspections" DROP COLUMN "approval_status";--> statement-breakpoint
ALTER TABLE "apar_inspections" DROP COLUMN "approval_submitted_by_id";--> statement-breakpoint
ALTER TABLE "apar_inspections" DROP COLUMN "approval_actor_id";--> statement-breakpoint
ALTER TABLE "apar_inspections" DROP COLUMN "approval_acted_at";--> statement-breakpoint
ALTER TABLE "hydrant_inspections" DROP COLUMN "approval_status";--> statement-breakpoint
ALTER TABLE "hydrant_inspections" DROP COLUMN "approval_submitted_by_id";--> statement-breakpoint
ALTER TABLE "hydrant_inspections" DROP COLUMN "approval_actor_id";--> statement-breakpoint
ALTER TABLE "hydrant_inspections" DROP COLUMN "approval_acted_at";--> statement-breakpoint
ALTER TABLE "p3k_inspections" DROP COLUMN "approval_status";--> statement-breakpoint
ALTER TABLE "p3k_inspections" DROP COLUMN "approval_submitted_by_id";--> statement-breakpoint
ALTER TABLE "p3k_inspections" DROP COLUMN "approval_actor_id";--> statement-breakpoint
ALTER TABLE "p3k_inspections" DROP COLUMN "approval_acted_at";--> statement-breakpoint
ALTER TABLE "safety_patrol_reports" DROP COLUMN "approval_status";--> statement-breakpoint
ALTER TABLE "safety_patrol_reports" DROP COLUMN "approval_submitted_by_id";--> statement-breakpoint
ALTER TABLE "safety_patrol_reports" DROP COLUMN "approval_actor_id";--> statement-breakpoint
ALTER TABLE "safety_patrol_reports" DROP COLUMN "approval_acted_at";--> statement-breakpoint
DROP TYPE "public"."approval_status";--> statement-breakpoint
DROP TYPE "public"."role";