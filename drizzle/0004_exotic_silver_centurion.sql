ALTER TABLE `usage_events` ADD `client_attempt` integer;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `provider_attempts` integer;--> statement-breakpoint
ALTER TABLE `usage_events` ADD `error_code` text;--> statement-breakpoint
CREATE INDEX `idx_usage_events_event_error_code` ON `usage_events` (`event`,`error_code`);