CREATE INDEX "p3k_inspection_items_inspection_id_idx" ON "p3k_inspection_items" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "photos_hydrant_inspection_id_idx" ON "photos" USING btree ("hydrant_inspection_id");--> statement-breakpoint
CREATE INDEX "photos_apar_inspection_id_idx" ON "photos" USING btree ("apar_inspection_id");--> statement-breakpoint
CREATE INDEX "safety_patrol_findings_report_id_idx" ON "safety_patrol_findings" USING btree ("report_id");