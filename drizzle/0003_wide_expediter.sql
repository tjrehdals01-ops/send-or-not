ALTER TABLE `usage_events` ADD `review_id` text;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `feedback` text;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `share_method` text;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `duration_ms` integer;--> statement-breakpoint
CREATE INDEX `idx_usage_events_event_review` ON `usage_events` (`event`,`review_id`);