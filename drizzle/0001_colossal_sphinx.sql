CREATE TABLE `ai_consultations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consultationType` enum('crisis','signalAnalysis','messageRecommendation','other') NOT NULL,
	`userInput` text NOT NULL,
	`aiResponse` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_consultations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_usage_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`usageDate` varchar(10) NOT NULL,
	`consultationCount` int DEFAULT 0,
	`maxAllowed` int DEFAULT 3,
	`tier` enum('free','premium') DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_usage_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommended_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consultationId` int,
	`message` text NOT NULL,
	`context` text,
	`category` varchar(50),
	`copied` boolean DEFAULT false,
	`used` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommended_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationship_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int DEFAULT 50,
	`factors` json,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relationship_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `relationship_scores_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`type` enum('birthday','anniversary','actionPlan','other') NOT NULL,
	`dueDate` timestamp NOT NULL,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nickname` varchar(100) NOT NULL,
	`relationshipType` enum('dating','crush','longDistance','newlywed') NOT NULL,
	`partnerName` varchar(100) NOT NULL,
	`startDate` timestamp,
	`lastMetDate` timestamp,
	`lastConflictDate` timestamp,
	`contactFrequency` int DEFAULT 7,
	`notes` text,
	`onboardingCompleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
