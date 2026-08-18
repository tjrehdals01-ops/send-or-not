ALTER TABLE `usage_events` ADD `recipient_category` text;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `message_length_bucket` text;--> statement-breakpoint
CREATE INDEX `idx_usage_events_channel_created_at` ON `usage_events` (`channel`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_usage_events_recipient_created_at` ON `usage_events` (`recipient_category`,`created_at`);