CREATE INDEX "apar_inspections_company_period_idx" ON "apar_inspections" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "apar_units_site_id_idx" ON "apar_units" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "apar_units_company_expired_idx" ON "apar_units" USING btree ("company_id","expired_date");--> statement-breakpoint
CREATE INDEX "hydrant_inspections_company_period_idx" ON "hydrant_inspections" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "hydrant_units_site_id_idx" ON "hydrant_units" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "p3k_boxes_site_id_idx" ON "p3k_boxes" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "safety_patrol_reports_site_id_idx" ON "safety_patrol_reports" USING btree ("site_id");