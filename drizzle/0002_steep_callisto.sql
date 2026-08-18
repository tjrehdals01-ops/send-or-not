ALTER TABLE `usage_events` ADD `traffic_type` text;--> statement-breakpoint
CREATE INDEX `idx_usage_events_traffic_created_at` ON `usage_events` (`traffic_type`,`created_at`);