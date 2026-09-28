CREATE TABLE `admin_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`passwordHash` varchar(128) NOT NULL,
	`passwordSalt` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerName` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`requestedDate` varchar(16) NOT NULL,
	`requestedTime` varchar(40) NOT NULL,
	`fulfilment` enum('collection','delivery') NOT NULL,
	`address` text,
	`items` json NOT NULL,
	`occasion` varchar(100),
	`notes` text,
	`status` enum('new','confirmed','completed','cancelled') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guestName` varchar(100),
	`products` json NOT NULL,
	`comments` text NOT NULL,
	`rating` int NOT NULL,
	`recommendation` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
