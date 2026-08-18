CREATE TABLE `usage_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`used_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`relationship` text NOT NULL,
	`channel` text NOT NULL,
	`tone` text NOT NULL
);
