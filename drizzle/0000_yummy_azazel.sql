CREATE TABLE `demo_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`payload` text NOT NULL,
	`total_cents` integer NOT NULL,
	`representative_cents` integer NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'demo_request' NOT NULL
);
