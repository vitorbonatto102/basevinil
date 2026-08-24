CREATE TABLE `catalog_edits` (
	`record_id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`payload` text DEFAULT '{}' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
