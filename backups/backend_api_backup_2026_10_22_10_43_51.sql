-- Gold Pawn ERP Database Backup
-- Generated: 2026-10-22T10:43:51.009Z

CREATE TABLE `admin_registration_otps` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin_otp_email` (`email`),
  KEY `idx_admin_otp_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_module` (`module_name`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_reference` (`reference_type`,`reference_id`),
  KEY `idx_audit_date` (`created_at`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `module_name`, `reference_type`, `reference_id`, `old_data`, `new_data`, `description`, `ip_address`, `device_info`, `created_at`) VALUES (1, NULL, 'admin', 'ADMIN_LOGIN', 'Security', NULL, NULL, NULL, NULL, 'Admin logged in successfully from local client.', '127.0.0.1', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `module_name`, `reference_type`, `reference_id`, `old_data`, `new_data`, `description`, `ip_address`, `device_info`, `created_at`) VALUES (2, NULL, 'admin', 'CREATE_CUSTOMER', 'Customers', NULL, NULL, NULL, NULL, 'Customer Ramesh Kumar (CUST-1001) registered.', '127.0.0.1', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `module_name`, `reference_type`, `reference_id`, `old_data`, `new_data`, `description`, `ip_address`, `device_info`, `created_at`) VALUES (3, NULL, 'admin', 'CREATE_LOAN', 'Loans', NULL, NULL, NULL, NULL, 'Pawn Loan PL-2026-001 created for principal 150000.00.', '127.0.0.1', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `module_name`, `reference_type`, `reference_id`, `old_data`, `new_data`, `description`, `ip_address`, `device_info`, `created_at`) VALUES (4, NULL, 'admin', 'CREATE_PAYMENT', 'Payments', NULL, NULL, NULL, NULL, 'Payment RCP-2026-001 recorded for 30000.00.', '127.0.0.1', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `module_name`, `reference_type`, `reference_id`, `old_data`, `new_data`, `description`, `ip_address`, `device_info`, `created_at`) VALUES (5, NULL, 'admin', 'PARTIAL_RELEASE', 'Releases', NULL, NULL, NULL, NULL, 'Partial gold release REL-2026-001 created.', '127.0.0.1', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `audit_logs` (`id`, `user_id`, `username`, `action`, `module_name`, `reference_type`, `reference_id`, `old_data`, `new_data`, `description`, `ip_address`, `device_info`, `created_at`) VALUES (6, NULL, 'admin', 'CLOSE_LOAN', 'Loans', NULL, NULL, NULL, NULL, 'Pawn Loan PL-2026-005 closed completely.', '127.0.0.1', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');

CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `aadhaar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_code` (`customer_code`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_customer_code` (`customer_code`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (1, 'CUST-1001', 'Ramesh Kumar', '9876543210', '124, Market Road, Block A, Central City', '1234-5678-9012', 'ABCDE1234F', NULL, 'ACTIVE', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (2, 'CUST-1002', 'Sunita Devi', '9812345678', '56, Gandhi Nagar, Near Bank of Baroda', '2345-6789-0123', 'FGHIJ5678K', NULL, 'ACTIVE', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (3, 'CUST-1003', 'Vikram Singh', '9988776655', '88, Civil Lines, Opposite Police Station', '3456-7890-1234', 'KLMNO9012P', NULL, 'ACTIVE', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (4, 'CUST-1004', 'Ananya Roy', '9765432109', '12/B, Lake View Apartment, North Extension', '4567-8901-2345', 'PQRST3456Q', NULL, 'ACTIVE', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (5, 'CUST-1005', 'Mohan Lal', '9654321098', '45, Station Road, Industrial Area', '5678-9012-3456', 'UVWXY7890R', NULL, 'ACTIVE', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (6, 'CUST-1006', 'Prabhas', '9345834909', 'Puttur', '282745206073', NULL, NULL, 'ACTIVE', 'Thu Oct 22 2026 11:57:40 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:57:40 GMT+0530 (India Standard Time)');
INSERT INTO `customers` (`id`, `customer_code`, `name`, `mobile`, `address`, `aadhaar_number`, `pan_number`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (7, 'CUST-1007', 'Dhamu', '9391590315', 'SR Puram', NULL, NULL, NULL, 'ACTIVE', 'Thu Oct 22 2026 14:09:10 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 14:09:10 GMT+0530 (India Standard Time)');

CREATE TABLE `gold_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `item_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purity` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '22K',
  `weight` decimal(8,3) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('AVAILABLE','PLEDGED','RELEASED','PARTIALLY_RELEASED') COLLATE utf8mb4_unicode_ci DEFAULT 'AVAILABLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_customer` (`customer_id`),
  CONSTRAINT `gold_items_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (1, 1, '22K Heavy Gold Chain', '22K', '24.500', 'Hallmarked 916 BIS with pendant', NULL, 'PLEDGED', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (2, 1, '22K Gold Bangle Set (2 Pcs)', '22K', '38.200', 'Solid gold bangles', NULL, 'PLEDGED', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (3, 2, '24K Mint Gold Coin', '24K', '10.000', 'MMTC PAMP Certified Coin', NULL, 'PLEDGED', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (4, 3, '22K Traditional Gold Necklace', '22K', '45.600', 'Intricate antique design', NULL, 'PLEDGED', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (5, 4, '22K Designer Gold Ring', '22K', '8.500', 'Single gemstone ring', NULL, 'PARTIALLY_RELEASED', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (6, 5, '925 Silver Anklet Pair', 'SILVER_925', '120.000', 'Solid silver anklets', NULL, 'RELEASED', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (7, 6, 'Chain', '24K', '40.000', NULL, NULL, 'RELEASED', 'Thu Oct 22 2026 11:58:40 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (8, 7, 'Bracelet', '24K', '40.000', NULL, NULL, 'AVAILABLE', 'Thu Oct 22 2026 14:09:32 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 14:09:32 GMT+0530 (India Standard Time)');
INSERT INTO `gold_items` (`id`, `customer_id`, `item_name`, `purity`, `weight`, `remarks`, `photo_url`, `status`, `created_at`, `updated_at`) VALUES (10, 6, '22K Gold Bangle', '22K', '24.800', NULL, NULL, 'RELEASED', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `interest_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `monthly_rate` decimal(5,2) NOT NULL,
  `interest_amount` decimal(12,2) NOT NULL,
  `is_manual` tinyint(1) DEFAULT '0',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_loan` (`loan_id`),
  CONSTRAINT `interest_records_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (1, 1, 'Thu Jan 15 2026 00:00:00 GMT+0530 (India Standard Time)', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '2.00', '9000.00', 0, 'Standard Monthly Interest', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (2, 2, 'Sun Feb 01 2026 00:00:00 GMT+0530 (India Standard Time)', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '2.00', '2400.00', 0, 'Standard Monthly Interest', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (3, 3, 'Tue Feb 10 2026 00:00:00 GMT+0530 (India Standard Time)', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '1.80', '9000.00', 0, 'Standard Monthly Interest', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (4, 4, 'Thu Jan 01 2026 00:00:00 GMT+0530 (India Standard Time)', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '2.00', '4800.00', 0, 'Standard Monthly Interest', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (5, 5, 'Wed Oct 01 2025 00:00:00 GMT+0530 (India Standard Time)', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '2.00', '5000.00', 0, 'Standard Monthly Interest', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (6, 6, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '0.00', '5000.00', 1, 'Manual Final Settlement Interest', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (7, 7, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '0.00', '2000.00', 1, 'Manual Final Settlement Interest', 'Thu Oct 22 2026 12:57:36 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (8, 8, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '0.00', '1000.00', 1, 'Manual Final Settlement Interest', 'Thu Oct 22 2026 14:44:18 GMT+0530 (India Standard Time)');
INSERT INTO `interest_records` (`id`, `loan_id`, `period_start`, `period_end`, `monthly_rate`, `interest_amount`, `is_manual`, `remarks`, `created_at`) VALUES (9, 8, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '0.00', '50.00', 1, 'Manual Final Settlement Interest', 'Thu Oct 22 2026 14:45:32 GMT+0530 (India Standard Time)');

CREATE TABLE `loan_gold_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `gold_item_id` int NOT NULL,
  `pledged_weight` decimal(8,3) NOT NULL,
  `released_weight` decimal(8,3) NOT NULL DEFAULT '0.000',
  `status` enum('PLEDGED','RELEASED') COLLATE utf8mb4_unicode_ci DEFAULT 'PLEDGED',
  `pledge_date` date NOT NULL,
  `release_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_loan` (`loan_id`),
  KEY `idx_gold` (`gold_item_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `loan_gold_items_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `loan_gold_items_ibfk_2` FOREIGN KEY (`gold_item_id`) REFERENCES `gold_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (1, 1, 1, '24.500', '0.000', 'PLEDGED', 'Thu Jan 15 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (2, 1, 2, '38.200', '0.000', 'PLEDGED', 'Thu Jan 15 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (3, 2, 3, '10.000', '0.000', 'PLEDGED', 'Sun Feb 01 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (4, 3, 4, '45.600', '0.000', 'PLEDGED', 'Tue Feb 10 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (5, 4, 5, '8.500', '0.000', 'PLEDGED', 'Thu Jan 01 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (6, 5, 6, '120.000', '120.000', 'RELEASED', 'Wed Oct 01 2025 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (7, 8, 7, '40.000', '40.000', 'RELEASED', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 13:16:44 GMT+0530 (India Standard Time)');
INSERT INTO `loan_gold_items` (`id`, `loan_id`, `gold_item_id`, `pledged_weight`, `released_weight`, `status`, `pledge_date`, `release_date`, `created_at`) VALUES (9, 13, 10, '24.800', '24.800', 'RELEASED', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `loan_status_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_id` int NOT NULL,
  `old_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `changed_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'STAFF',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `loan_status_history_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `loan_status_history` (`id`, `loan_id`, `old_status`, `new_status`, `reason`, `changed_by`, `created_at`) VALUES (1, 6, 'PARTIALLY_PAID', 'CLOSED', 'Full settlement completed', 'STAFF', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `loan_status_history` (`id`, `loan_id`, `old_status`, `new_status`, `reason`, `changed_by`, `created_at`) VALUES (2, 7, 'ACTIVE', 'CLOSED', 'Full settlement completed', 'STAFF', 'Thu Oct 22 2026 12:57:36 GMT+0530 (India Standard Time)');
INSERT INTO `loan_status_history` (`id`, `loan_id`, `old_status`, `new_status`, `reason`, `changed_by`, `created_at`) VALUES (3, 8, 'ACTIVE', 'ACTIVE', 'Additional disbursement of ₹10000.00', 'STAFF', 'Thu Oct 22 2026 13:14:41 GMT+0530 (India Standard Time)');
INSERT INTO `loan_status_history` (`id`, `loan_id`, `old_status`, `new_status`, `reason`, `changed_by`, `created_at`) VALUES (4, 8, 'ACTIVE', 'ACTIVE', 'Additional disbursement of ₹10000.00', 'STAFF', 'Thu Oct 22 2026 13:16:44 GMT+0530 (India Standard Time)');
INSERT INTO `loan_status_history` (`id`, `loan_id`, `old_status`, `new_status`, `reason`, `changed_by`, `created_at`) VALUES (5, 8, 'ACTIVE', 'CLOSED', 'Full settlement completed', 'STAFF', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `loan_status_history` (`id`, `loan_id`, `old_status`, `new_status`, `reason`, `changed_by`, `created_at`) VALUES (6, 10, 'PARTIALLY_PAID', 'CLOSED', 'Full settlement completed', 'STAFF', 'Thu Oct 22 2026 15:08:10 GMT+0530 (India Standard Time)');

CREATE TABLE `loan_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `loan_id` int NOT NULL,
  `transaction_type` enum('LOAN_CREATED','EXISTING_LOAN_CREATED','ADDITIONAL_LOAN','PAYMENT','PARTIAL_PAYMENT','FULL_PAYMENT','INTEREST_CALCULATION','FINAL_MANUAL_INTEREST','FINAL_SETTLEMENT','PARTIAL_RELEASE','FULL_RELEASE','LOAN_CLOSED','PAYMENT_REVERSAL','RELEASE_REVERSAL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `weight` decimal(8,3) NOT NULL DEFAULT '0.000',
  `reference_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'STAFF',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_code` (`transaction_code`),
  KEY `idx_tx_type` (`transaction_type`),
  KEY `idx_tx_date` (`date`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_loan` (`loan_id`),
  CONSTRAINT `loan_transactions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `loan_transactions_ibfk_2` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (1, 'TXN-2026-001', 1, 1, 'LOAN_CREATED', '150000.00', '62.700', 'PL-2026-001', 'Thu Jan 15 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'New Pawn Loan Created', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (2, 'TXN-2026-002', 1, 1, 'PAYMENT', '30000.00', '0.000', 'RCP-2026-001', 'Sun Feb 15 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'Partial Payment Received', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (3, 'TXN-2026-003', 2, 2, 'LOAN_CREATED', '60000.00', '10.000', 'PL-2026-002', 'Sun Feb 01 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'New Pawn Loan Created', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (4, 'TXN-2026-004', 3, 3, 'LOAN_CREATED', '250000.00', '45.600', 'PL-2026-003', 'Tue Feb 10 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'New Pawn Loan Created', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (5, 'TXN-2026-005', 3, 3, 'PAYMENT', '50000.00', '0.000', 'RCP-2026-002', 'Fri Feb 20 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'Partial Payment Received', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (6, 'TXN-2026-006', 4, 4, 'PARTIAL_RELEASE', '20000.00', '8.500', 'REL-2026-001', 'Wed Feb 25 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'Partial Gold Release & Payment', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (7, 'TXN-2026-007', 5, 5, 'LOAN_CLOSED', '55000.00', '120.000', 'RCP-2026-004', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'admin', 'Full Settlement & Collateral Released', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (8, 'TXN-1792650560255-5', 6, 6, 'LOAN_CREATED', '50000.00', '0.000', 'PL-2026-1006', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '11:59:20', 'STAFF', 'New Pawn Loan PL-2026-1006 created for ₹50000', 'Thu Oct 22 2026 11:59:20 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (9, 'TXN-1792650610284-405', 6, 6, 'PAYMENT', '5000.00', '0.000', 'RCP-20261022-2OZLQ', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:10', 'STAFF', 'Payment recorded', 'Thu Oct 22 2026 12:00:10 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (10, 'TXN-1792650752290-502', 6, 6, 'PAYMENT', '5000.00', '0.000', 'RCP-20261022-IIS3G', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:02:32', 'STAFF', 'Payment recorded', 'Thu Oct 22 2026 12:02:32 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (11, 'TXN-1792650765721-217', 6, 6, 'PAYMENT', '5000.00', '0.000', 'RCP-20261022-GS4EC', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:02:45', 'STAFF', 'Payment recorded', 'Thu Oct 22 2026 12:02:45 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (12, 'TXN-1792651897448-189', 6, 6, 'PAYMENT', '5000.00', '0.000', 'RCP-20261022-Z3DXU', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:21:37', 'STAFF', 'Payment recorded', 'Thu Oct 22 2026 12:21:37 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (14, 'TXN-1792653960059-886', 6, 6, 'FINAL_MANUAL_INTEREST', '5000.00', '0.000', 'PL-2026-1006', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:56:00', 'STAFF', 'Manual Final Interest of ₹5000.00 applied', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (15, 'TXN-1792653960118-202', 6, 6, 'FULL_PAYMENT', '35000.00', '0.000', 'RCP-SET-20261022-J0VY8', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:56:00', 'STAFF', 'Settlement payment received: ₹35000. Remaining: ₹0', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (16, 'TXN-1792653960127-522', 6, 6, 'FULL_RELEASE', '0.00', '0.000', 'PL-2026-1006', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:56:00', 'STAFF', 'Full release of gold collateral (0g) upon closure', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (17, 'TXN-1792653960129-346', 6, 6, 'LOAN_CLOSED', '0.00', '0.000', 'PL-2026-1006', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:56:00', 'STAFF', 'Loan PL-2026-1006 fully settled and closed', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (22, 'TXN-1792654218839-250', 6, 8, 'LOAN_CREATED', '10000.00', '0.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '13:00:18', 'STAFF', 'New Pawn Loan PL-2026-1008 created for ₹10000', 'Thu Oct 22 2026 13:00:18 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (24, 'TXN-1792655081233-588', 6, 8, 'ADDITIONAL_LOAN', '10000.00', '0.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '13:14:41', 'STAFF', 'Additional disbursement of ₹10000.00 under loan PL-2026-1008. Combined principal: ₹20000.00', 'Thu Oct 22 2026 13:14:41 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (25, 'TXN-1792655204659-862', 6, 8, 'ADDITIONAL_LOAN', '10000.00', '40.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '13:16:44', 'STAFF', 'Additional disbursement of ₹10000.00 under loan PL-2026-1008. Combined principal: ₹30000.00', 'Thu Oct 22 2026 13:16:44 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (26, 'TXN-1792658133811-637', 6, 8, 'PAYMENT', '5000.00', '0.000', 'RCP-20261022-X81LS', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:05:33', 'STAFF', 'Payment recorded: ₹5000 (Principal: ₹4000, Manual Interest: ₹1000)', 'Thu Oct 22 2026 14:05:33 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (27, 'TXN-1792658416462-815', 7, 10, 'LOAN_CREATED', '50000.00', '0.000', 'PL-2026-1009', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:10:16', 'STAFF', 'New Pawn Loan PL-2026-1009 created for ₹50000', 'Thu Oct 22 2026 14:10:16 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (28, 'TXN-1792659749973-338', 6, 8, 'PAYMENT', '5100.00', '0.000', 'RCP-20261022-JUNWN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:32:29', 'STAFF', 'Principal Payment: ₹5000.00, Manual Interest: ₹100.00, Total Received: ₹5100.00', 'Thu Oct 22 2026 14:32:29 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (29, 'TXN-1792659984149-232', 6, 8, 'PAYMENT', '5100.00', '0.000', 'RCP-20261022-XMWJM', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:36:24', 'STAFF', 'Principal Payment: ₹5000.00, Manual Interest: ₹100.00, Total Received: ₹5100.00', 'Thu Oct 22 2026 14:36:24 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (30, 'TXN-1792660333765-88', 7, 10, 'PAYMENT', '5100.00', '0.000', 'RCP-20261022-U1DRA', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:42:13', 'STAFF', 'Principal Payment: ₹5000.00, Manual Interest: ₹100.00, Total Received: ₹5100.00', 'Thu Oct 22 2026 14:42:13 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (31, 'TXN-1792660458933-645', 6, 8, 'FINAL_MANUAL_INTEREST', '1000.00', '0.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:44:18', 'STAFF', 'Manual Final Interest of ₹1000.00 applied', 'Thu Oct 22 2026 14:44:18 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (32, 'TXN-1792660458964-907', 6, 8, 'PARTIAL_PAYMENT', '15000.00', '0.000', 'RCP-SET-20261022-Y11PJ', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:44:18', 'STAFF', 'Settlement payment received: ₹15000. Remaining: ₹1000', 'Thu Oct 22 2026 14:44:18 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (33, 'TXN-1792660532411-630', 6, 8, 'FINAL_MANUAL_INTEREST', '50.00', '0.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:32', 'STAFF', 'Manual Final Interest of ₹50.00 applied', 'Thu Oct 22 2026 14:45:32 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (34, 'TXN-1792660532420-608', 6, 8, 'PARTIAL_PAYMENT', '1000.00', '0.000', 'RCP-SET-20261022-W1I9G', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:32', 'STAFF', 'Settlement payment received: ₹1000. Remaining: ₹50', 'Thu Oct 22 2026 14:45:32 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (35, 'TXN-1792660541165-489', 6, 8, 'FULL_PAYMENT', '50.00', '0.000', 'RCP-SET-20261022-YXF7I', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:41', 'STAFF', 'Settlement payment received: ₹50. Remaining: ₹0', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (36, 'TXN-1792660541185-44', 6, 8, 'FULL_RELEASE', '0.00', '40.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:41', 'STAFF', 'Full release of gold collateral (40g) upon closure', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (37, 'TXN-1792660541186-287', 6, 8, 'LOAN_CLOSED', '0.00', '0.000', 'PL-2026-1008', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:41', 'STAFF', 'Loan PL-2026-1008 fully settled and closed', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (38, 'TXN-1792661208448-998', 1, 11, 'LOAN_CREATED', '20000.00', '0.000', 'PL-2026-1011', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:56:48', 'STAFF', 'New Pawn Loan PL-2026-1011 created for ₹20000', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (39, 'TXN-1792661208535-39', 1, 11, 'FULL_PAYMENT', '20100.00', '0.000', 'RCP-20261022-OU4S7', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:56:48', 'STAFF', 'Principal Payment: ₹20000.00, Manual Interest: ₹100.00, Total Received: ₹20100.00', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (42, 'TXN-1792661890862-154', 7, 10, 'FULL_PAYMENT', '45000.00', '0.000', 'RCP-SET-20261022-ICJFE', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:08:10', 'STAFF', 'Settlement payment received: ₹45000. Remaining: ₹0', 'Thu Oct 22 2026 15:08:10 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (43, 'TXN-1792661890875-616', 7, 10, 'FULL_RELEASE', '0.00', '0.000', 'PL-2026-1009', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:08:10', 'STAFF', 'Full release of gold collateral (0g) upon closure', 'Thu Oct 22 2026 15:08:10 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (44, 'TXN-1792661890880-848', 7, 10, 'LOAN_CLOSED', '0.00', '0.000', 'PL-2026-1009', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:08:10', 'STAFF', 'Loan PL-2026-1009 fully settled and closed', 'Thu Oct 22 2026 15:08:10 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (45, 'TXN-REL-1792662434420-292', 6, 13, 'FULL_RELEASE', '0.00', '24.800', 'REL-20261022-9U3NG', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:17:14', 'STAFF', 'Full release of gold collateral upon loan closure', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');
INSERT INTO `loan_transactions` (`id`, `transaction_code`, `customer_id`, `loan_id`, `transaction_type`, `amount`, `weight`, `reference_id`, `date`, `time`, `created_by`, `remarks`, `created_at`) VALUES (46, 'TXN-1792662434440-383', 6, 13, 'FULL_PAYMENT', '30250.00', '0.000', 'RCP-20261022-R3NVN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:17:14', 'STAFF', 'Principal Payment: ₹30000.00, Manual Interest: ₹250.00, Total Received: ₹30250.00', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `loans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `loan_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manual_loan_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` int NOT NULL,
  `loan_type` enum('NEW_LOAN','EXISTING_LOAN','ADDITIONAL_LOAN') COLLATE utf8mb4_unicode_ci DEFAULT 'NEW_LOAN',
  `opened_date` date NOT NULL,
  `manual_opened_date` date DEFAULT NULL,
  `closed_date` date DEFAULT NULL,
  `manual_closed_date` date DEFAULT NULL,
  `principal_amount` decimal(12,2) NOT NULL,
  `monthly_interest_rate` decimal(5,2) NOT NULL DEFAULT '2.00',
  `interest_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'MONTHLY_SIMPLE',
  `total_interest` decimal(12,2) NOT NULL DEFAULT '0.00',
  `manual_final_interest` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_due` decimal(12,2) NOT NULL,
  `total_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `remaining_balance` decimal(12,2) NOT NULL,
  `status` enum('ACTIVE','CLOSED','PARTIALLY_PAID','PARTIALLY_RELEASED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `loan_no` (`loan_no`),
  KEY `idx_status` (`status`),
  KEY `idx_opened_date` (`opened_date`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_loan_no` (`loan_no`),
  KEY `idx_manual_loan_no` (`manual_loan_no`),
  CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (1, 'PL-2026-001', NULL, 1, 'NEW_LOAN', 'Thu Jan 15 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, NULL, NULL, '150000.00', '2.00', 'MONTHLY_SIMPLE', '9000.00', '0.00', '159000.00', '30000.00', '129000.00', 'ACTIVE', 'Regular monthly payment customer', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 13:12:51 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (2, 'PL-2026-002', NULL, 2, 'NEW_LOAN', 'Sun Feb 01 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, NULL, NULL, '60000.00', '2.00', 'MONTHLY_SIMPLE', '2400.00', '0.00', '62400.00', '0.00', '62400.00', 'ACTIVE', 'New gold coin loan', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (3, 'PL-2026-003', NULL, 3, 'NEW_LOAN', 'Tue Feb 10 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, NULL, NULL, '250000.00', '1.80', 'MONTHLY_SIMPLE', '9000.00', '0.00', '259000.00', '50000.00', '209000.00', 'ACTIVE', 'High value customer special rate', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 13:12:51 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (4, 'PL-2026-004', NULL, 4, 'NEW_LOAN', 'Thu Jan 01 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, NULL, NULL, '80000.00', '2.00', 'MONTHLY_SIMPLE', '4800.00', '0.00', '84800.00', '20000.00', '64800.00', 'ACTIVE', 'Partial payment made for ornament release', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 13:12:51 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (5, 'PL-2026-005', NULL, 5, 'EXISTING_LOAN', 'Wed Oct 01 2025 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, '50000.00', '2.00', 'MONTHLY_SIMPLE', '5000.00', '0.00', '55000.00', '55000.00', '0.00', 'CLOSED', 'Full payment received and collateral handed back', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (6, 'PL-2026-1006', NULL, 6, 'NEW_LOAN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, '50000.00', '2.00', 'MONTHLY_SIMPLE', '0.00', '5000.00', '55000.00', '55000.00', '0.00', 'CLOSED', NULL, 'Thu Oct 22 2026 11:59:20 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (8, 'PL-2026-1008', NULL, 6, 'NEW_LOAN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, '30000.00', '2.00', 'MONTHLY_SIMPLE', '0.00', '1050.00', '31050.00', '31050.00', '0.00', 'CLOSED', NULL, 'Thu Oct 22 2026 13:00:18 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (10, 'PL-2026-1009', NULL, 7, 'NEW_LOAN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, '50000.00', '2.00', 'MONTHLY_SIMPLE', '0.00', '0.00', '50000.00', '50000.00', '0.00', 'CLOSED', NULL, 'Thu Oct 22 2026 14:10:16 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 15:08:11 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (11, 'PL-2026-1011', NULL, 1, 'NEW_LOAN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, '20000.00', '2.00', 'MONTHLY_SIMPLE', '0.00', '0.00', '20000.00', '20000.00', '0.00', 'CLOSED', 'Auto Release Test Loan', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)');
INSERT INTO `loans` (`id`, `loan_no`, `manual_loan_no`, `customer_id`, `loan_type`, `opened_date`, `manual_opened_date`, `closed_date`, `manual_closed_date`, `principal_amount`, `monthly_interest_rate`, `interest_type`, `total_interest`, `manual_final_interest`, `total_due`, `total_paid`, `remaining_balance`, `status`, `remarks`, `created_at`, `updated_at`) VALUES (13, 'PL-2026-1015', NULL, 6, 'NEW_LOAN', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', NULL, '30000.00', '2.00', 'MONTHLY_SIMPLE', '0.00', '0.00', '30000.00', '30000.00', '0.00', 'CLOSED', NULL, 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `login_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `login_status` enum('SUCCESS','FAILED','LOCKED','LOGOUT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `failure_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `login_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `logout_at` datetime DEFAULT NULL,
  `session_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_login_user` (`user_id`),
  KEY `idx_login_username` (`username`),
  KEY `idx_login_status` (`login_status`),
  KEY `idx_login_date` (`login_at`),
  CONSTRAINT `fk_login_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `login_logs` (`id`, `user_id`, `username`, `login_status`, `ip_address`, `device_info`, `user_agent`, `failure_reason`, `login_at`, `logout_at`, `session_id`) VALUES (1, NULL, 'admin', 'SUCCESS', '127.0.0.1', 'Chrome Web / Windows Desktop', NULL, NULL, 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)', NULL, NULL);

CREATE TABLE `partial_releases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `release_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `payment_id` int DEFAULT NULL,
  `release_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PARTIAL',
  `total_weight_released` decimal(8,3) NOT NULL,
  `release_date` date NOT NULL,
  `release_time` time NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'STAFF',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `release_no` (`release_no`),
  KEY `payment_id` (`payment_id`),
  KEY `idx_loan` (`loan_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_date` (`release_date`),
  CONSTRAINT `partial_releases_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `partial_releases_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `partial_releases_ibfk_3` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (1, 'REL-2026-001', 4, 4, 3, 'PARTIAL', '8.500', 'Wed Feb 25 2026 00:00:00 GMT+0530 (India Standard Time)', '12:15:00', 'Partial release of 22K Gold Ring after payment', 'admin', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (3, 'REL-20261022-9U3NG', 13, 6, 21, 'FULL', '24.800', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:17:14', 'Automatic full release upon complete loan settlement', 'STAFF', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');
INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (4, 'REL-FULL-20261022-PL2026005', 5, 5, 4, 'FULL', '120.000', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'Automatic full release upon loan closure', 'STAFF', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');
INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (5, 'REL-FULL-20261022-PL20261006', 6, 6, 9, 'FULL', '0.000', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'Automatic full release upon loan closure', 'STAFF', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');
INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (6, 'REL-FULL-20261022-PL20261008', 8, 6, 17, 'FULL', '40.000', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'Automatic full release upon loan closure', 'STAFF', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');
INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (7, 'REL-FULL-20261022-PL20261009', 10, 7, 20, 'FULL', '0.000', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'Automatic full release upon loan closure', 'STAFF', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');
INSERT INTO `partial_releases` (`id`, `release_no`, `loan_id`, `customer_id`, `payment_id`, `release_type`, `total_weight_released`, `release_date`, `release_time`, `remarks`, `created_by`, `created_at`) VALUES (8, 'REL-FULL-20261022-PL20261011', 11, 1, 18, 'FULL', '0.000', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:00', 'Automatic full release upon loan closure', 'STAFF', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');

CREATE TABLE `payment_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_id` int NOT NULL,
  `principal_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `interest_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `manual_interest_paid` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `payment_allocations_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (1, 1, '21000.00', '9000.00', '0.00', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (2, 2, '41000.00', '9000.00', '0.00', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (3, 3, '15200.00', '4800.00', '0.00', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (4, 4, '50000.00', '5000.00', '0.00', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (5, 5, '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 12:00:10 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (6, 6, '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 12:02:32 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (7, 7, '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 12:02:45 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (8, 8, '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 12:21:37 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (9, 9, '35000.00', '0.00', '5000.00', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (10, 10, '22000.00', '0.00', '2000.00', 'Thu Oct 22 2026 12:57:36 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (11, 11, '4000.00', '0.00', '1000.00', 'Thu Oct 22 2026 14:05:33 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (12, 12, '5000.00', '0.00', '100.00', 'Thu Oct 22 2026 14:32:29 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (13, 13, '5000.00', '0.00', '100.00', 'Thu Oct 22 2026 14:36:24 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (14, 14, '5000.00', '0.00', '100.00', 'Thu Oct 22 2026 14:42:13 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (15, 15, '15000.00', '0.00', '1000.00', 'Thu Oct 22 2026 14:44:18 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (16, 16, '1000.00', '0.00', '50.00', 'Thu Oct 22 2026 14:45:32 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (17, 17, '50.00', '0.00', '0.00', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (18, 18, '20000.00', '0.00', '100.00', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (19, 19, '20000.00', '0.00', '200.00', 'Thu Oct 22 2026 14:57:32 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (20, 20, '45000.00', '0.00', '0.00', 'Thu Oct 22 2026 15:08:10 GMT+0530 (India Standard Time)');
INSERT INTO `payment_allocations` (`id`, `payment_id`, `principal_paid`, `interest_paid`, `manual_interest_paid`, `created_at`) VALUES (21, 21, '30000.00', '0.00', '250.00', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loan_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `payment_type` enum('NORMAL','PARTIAL','FINAL_SETTLEMENT','RELEASE_PAYMENT') COLLATE utf8mb4_unicode_ci DEFAULT 'PARTIAL',
  `amount` decimal(12,2) NOT NULL,
  `manual_interest` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_received` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payment_date` date NOT NULL,
  `payment_time` time NOT NULL,
  `payment_mode` enum('CASH','BANK_TRANSFER','UPI','CHEQUE') COLLATE utf8mb4_unicode_ci DEFAULT 'CASH',
  `previous_paid` decimal(12,2) NOT NULL,
  `new_total_paid` decimal(12,2) NOT NULL,
  `remaining_balance` decimal(12,2) NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'STAFF',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `idx_loan` (`loan_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_date` (`payment_date`),
  KEY `idx_type` (`payment_type`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (1, 'RCP-2026-001', 1, 1, 'PARTIAL', '30000.00', '0.00', '0.00', 'Sun Feb 15 2026 00:00:00 GMT+0530 (India Standard Time)', '11:30:00', 'UPI', '0.00', '30000.00', '129000.00', 'Partial principal + interest payment via GPay', 'admin', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (2, 'RCP-2026-002', 3, 3, 'PARTIAL', '50000.00', '0.00', '0.00', 'Fri Feb 20 2026 00:00:00 GMT+0530 (India Standard Time)', '11:30:00', 'BANK_TRANSFER', '0.00', '50000.00', '209000.00', 'IMPS Bank Transfer Received', 'admin', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (3, 'RCP-2026-003', 4, 4, 'RELEASE_PAYMENT', '20000.00', '0.00', '0.00', 'Wed Feb 25 2026 00:00:00 GMT+0530 (India Standard Time)', '11:30:00', 'CASH', '0.00', '20000.00', '64800.00', 'Partial Release Payment in Cash', 'admin', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (4, 'RCP-2026-004', 5, 5, 'FINAL_SETTLEMENT', '55000.00', '0.00', '0.00', 'Sat Feb 28 2026 00:00:00 GMT+0530 (India Standard Time)', '11:30:00', 'CASH', '0.00', '55000.00', '0.00', 'Full loan closure and settlement', 'admin', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (5, 'RCP-20261022-2OZLQ', 6, 6, 'PARTIAL', '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:00:10', 'CASH', '0.00', '5000.00', '45000.00', NULL, 'STAFF', 'Thu Oct 22 2026 12:00:10 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (6, 'RCP-20261022-IIS3G', 6, 6, 'PARTIAL', '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:02:32', 'CASH', '5000.00', '10000.00', '40000.00', NULL, 'STAFF', 'Thu Oct 22 2026 12:02:32 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (7, 'RCP-20261022-GS4EC', 6, 6, 'PARTIAL', '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:02:45', 'CASH', '10000.00', '15000.00', '35000.00', NULL, 'STAFF', 'Thu Oct 22 2026 12:02:45 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (8, 'RCP-20261022-Z3DXU', 6, 6, 'PARTIAL', '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:21:37', 'CASH', '15000.00', '20000.00', '30000.00', NULL, 'STAFF', 'Thu Oct 22 2026 12:21:37 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (9, 'RCP-SET-20261022-J0VY8', 6, 6, 'FINAL_SETTLEMENT', '35000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:56:00', 'CASH', '20000.00', '55000.00', '0.00', 'Final Settlement Payment', 'STAFF', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (10, 'RCP-SET-20261022-27ETN', 7, 6, 'FINAL_SETTLEMENT', '22000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '12:57:36', 'CASH', '0.00', '22000.00', '0.00', 'Final Settlement Payment', 'STAFF', 'Thu Oct 22 2026 12:57:36 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (11, 'RCP-20261022-X81LS', 8, 6, 'PARTIAL', '5000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:05:33', 'CASH', '0.00', '5000.00', '25000.00', 'Test manual interest payment', 'STAFF', 'Thu Oct 22 2026 14:05:33 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (12, 'RCP-20261022-JUNWN', 8, 6, 'PARTIAL', '5000.00', '100.00', '5100.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:32:29', 'CASH', '5000.00', '10000.00', '20000.00', 'Test separate manual interest', 'STAFF', 'Thu Oct 22 2026 14:32:29 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (13, 'RCP-20261022-XMWJM', 8, 6, 'PARTIAL', '5000.00', '100.00', '5100.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:36:24', 'CASH', '10000.00', '15000.00', '15000.00', 'Case 1 Test', 'STAFF', 'Thu Oct 22 2026 14:36:24 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (14, 'RCP-20261022-U1DRA', 10, 7, 'PARTIAL', '5000.00', '100.00', '5100.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:42:13', 'CASH', '0.00', '5000.00', '45000.00', NULL, 'STAFF', 'Thu Oct 22 2026 14:42:13 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (15, 'RCP-SET-20261022-Y11PJ', 8, 6, 'PARTIAL', '15000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:44:18', 'CASH', '15000.00', '30000.00', '1000.00', 'Final Settlement Payment', 'STAFF', 'Thu Oct 22 2026 14:44:18 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (16, 'RCP-SET-20261022-W1I9G', 8, 6, 'PARTIAL', '1000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:32', 'CASH', '30000.00', '31000.00', '50.00', 'Final Settlement Payment', 'STAFF', 'Thu Oct 22 2026 14:45:32 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (17, 'RCP-SET-20261022-YXF7I', 8, 6, 'FINAL_SETTLEMENT', '50.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:45:41', 'CASH', '31000.00', '31050.00', '0.00', 'Final Settlement Payment', 'STAFF', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (18, 'RCP-20261022-OU4S7', 11, 1, 'FINAL_SETTLEMENT', '20000.00', '100.00', '20100.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '14:56:48', 'CASH', '0.00', '20000.00', '0.00', 'Final Settlement', 'STAFF', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (20, 'RCP-SET-20261022-ICJFE', 10, 7, 'FINAL_SETTLEMENT', '45000.00', '0.00', '0.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:08:10', 'CASH', '5000.00', '50000.00', '0.00', 'Final Settlement Payment', 'STAFF', 'Thu Oct 22 2026 15:08:10 GMT+0530 (India Standard Time)');
INSERT INTO `payments` (`id`, `receipt_no`, `loan_id`, `customer_id`, `payment_type`, `amount`, `manual_interest`, `total_received`, `payment_date`, `payment_time`, `payment_mode`, `previous_paid`, `new_total_paid`, `remaining_balance`, `remarks`, `created_by`, `created_at`) VALUES (21, 'RCP-20261022-R3NVN', 13, 6, 'FINAL_SETTLEMENT', '30000.00', '250.00', '30250.00', 'Thu Oct 22 2026 00:00:00 GMT+0530 (India Standard Time)', '15:17:14', 'CASH', '0.00', '30000.00', '0.00', 'Complete Full Settlement', 'STAFF', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permission_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (1, 'dashboard.view', 'View Dashboard', 'Dashboard', 'View ERP dashboard and KPIs.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (2, 'customer.view', 'View Customers', 'Customers', 'View customer records.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (3, 'customer.create', 'Create Customer', 'Customers', 'Create new customer.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (4, 'customer.edit', 'Edit Customer', 'Customers', 'Edit customer information.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (5, 'customer.delete', 'Delete Customer', 'Customers', 'Delete/deactivate customer.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (6, 'gold.view', 'View Gold Items', 'Gold', 'View gold collateral.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (7, 'gold.create', 'Create Gold Item', 'Gold', 'Add gold collateral.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (8, 'gold.edit', 'Edit Gold Item', 'Gold', 'Edit gold collateral.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (9, 'gold.delete', 'Delete Gold Item', 'Gold', 'Delete gold item.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (10, 'loan.view', 'View Loans', 'Loans', 'View pawn loans.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (11, 'loan.create', 'Create Loan', 'Loans', 'Create new pawn loan.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (12, 'loan.edit', 'Edit Loan', 'Loans', 'Edit loan information.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (13, 'loan.additional', 'Create Additional Loan', 'Loans', 'Create additional loan.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (14, 'loan.existing', 'Create Existing Loan', 'Loans', 'Register historical existing loan.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (15, 'loan.close', 'Close Loan', 'Loans', 'Close and settle loan.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (16, 'loan.approve', 'Approve Loan', 'Loans', 'Approve loan operation.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (17, 'payment.view', 'View Payments', 'Payments', 'View payments.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (18, 'payment.create', 'Create Payment', 'Payments', 'Record payment.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (19, 'payment.edit', 'Edit Payment', 'Payments', 'Edit payment.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (20, 'payment.approve', 'Approve Payment', 'Payments', 'Approve payment.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (21, 'release.view', 'View Releases', 'Releases', 'View gold releases.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (22, 'release.create', 'Create Partial Release', 'Releases', 'Create partial gold release.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (23, 'release.approve', 'Approve Release', 'Releases', 'Approve gold release.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (24, 'receipt.view', 'View Receipts', 'Receipts', 'View receipts.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (25, 'receipt.print', 'Print Receipts', 'Receipts', 'Print official A4 receipts.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (26, 'report.view', 'View Reports', 'Reports', 'View financial reports.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (27, 'report.export', 'Export Reports', 'Reports', 'Export reports.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (28, 'settings.view', 'View Settings', 'Settings', 'View ERP settings.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (29, 'settings.edit', 'Edit Settings', 'Settings', 'Modify ERP settings.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (30, 'user.view', 'View Users', 'User Management', 'View system users.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (31, 'user.create', 'Create User', 'User Management', 'Create system user.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (32, 'user.edit', 'Edit User', 'User Management', 'Edit system user.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (33, 'user.delete', 'Delete User', 'User Management', 'Deactivate system user.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (34, 'user.reset_password', 'Reset Password', 'User Management', 'Reset another users password.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (35, 'user.manage_roles', 'Manage Roles', 'User Management', 'Assign roles to users.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (36, 'user.manage_permissions', 'Manage Permissions', 'User Management', 'Manage role permissions.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (37, 'security.login_logs', 'View Login Logs', 'Security', 'View login activity.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (38, 'security.audit_logs', 'View Audit Logs', 'Security', 'View audit trail.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `permissions` (`id`, `permission_code`, `permission_name`, `module_name`, `description`, `created_at`) VALUES (39, 'security.sessions', 'Manage Sessions', 'Security', 'View and revoke user sessions.', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');

CREATE TABLE `receipts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receipt_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receipt_type` enum('LOAN','PAYMENT','PARTIAL_RELEASE','FULL_RELEASE','CLOSURE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `loan_id` int NOT NULL,
  `receipt_data_json` json NOT NULL,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `customer_id` (`customer_id`),
  KEY `loan_id` (`loan_id`),
  KEY `idx_receipt_no` (`receipt_no`),
  KEY `idx_type` (`receipt_type`),
  CONSTRAINT `receipts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `receipts_ibfk_2` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (1, 'RCP-2026-001', 'PAYMENT', 'RCP-2026-001', 1, 1, '[object Object]', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (2, 'RCP-2026-002', 'PAYMENT', 'RCP-2026-002', 3, 3, '[object Object]', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (3, 'RCP-2026-003', 'PARTIAL_RELEASE', 'REL-2026-001', 4, 4, '[object Object]', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (4, 'RCP-2026-004', 'CLOSURE', 'RCP-2026-004', 5, 5, '[object Object]', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (5, 'RCP-20261022-2OZLQ', 'PAYMENT', '5', 6, 6, '[object Object]', 'Thu Oct 22 2026 12:00:10 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (6, 'RCP-20261022-IIS3G', 'PAYMENT', '6', 6, 6, '[object Object]', 'Thu Oct 22 2026 12:02:32 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (7, 'RCP-20261022-GS4EC', 'PAYMENT', '7', 6, 6, '[object Object]', 'Thu Oct 22 2026 12:02:45 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (8, 'RCP-20261022-Z3DXU', 'PAYMENT', '8', 6, 6, '[object Object]', 'Thu Oct 22 2026 12:21:37 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (9, 'RCP-CLS-20261022-2026-1006', 'CLOSURE', 'PL-2026-1006', 6, 6, '[object Object]', 'Thu Oct 22 2026 12:56:00 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (11, 'RCP-ADD-20261022-0S34C5', 'LOAN', 'PL-2026-1008', 6, 8, '[object Object]', 'Thu Oct 22 2026 13:14:41 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (12, 'RCP-ADD-20261022-PPKUFK', 'LOAN', 'PL-2026-1008', 6, 8, '[object Object]', 'Thu Oct 22 2026 13:16:44 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (13, 'RCP-20261022-X81LS', 'PAYMENT', '11', 6, 8, '[object Object]', 'Thu Oct 22 2026 14:05:33 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (14, 'RCP-20261022-JUNWN', 'PAYMENT', '12', 6, 8, '[object Object]', 'Thu Oct 22 2026 14:32:29 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (15, 'RCP-20261022-XMWJM', 'PAYMENT', '13', 6, 8, '[object Object]', 'Thu Oct 22 2026 14:36:24 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (16, 'RCP-20261022-U1DRA', 'PAYMENT', '14', 7, 10, '[object Object]', 'Thu Oct 22 2026 14:42:13 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (17, 'RCP-CLS-20261022-2026-1008', 'CLOSURE', 'PL-2026-1008', 6, 8, '[object Object]', 'Thu Oct 22 2026 14:45:41 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (18, 'RCP-20261022-OU4S7', 'PAYMENT', '18', 1, 11, '[object Object]', 'Thu Oct 22 2026 14:56:48 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (21, 'RCP-CLS-20261022-2026-1009', 'CLOSURE', 'PL-2026-1009', 7, 10, '[object Object]', 'Thu Oct 22 2026 15:08:11 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (22, 'REL-20261022-9U3NG', 'FULL_RELEASE', '3', 6, 13, '[object Object]', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');
INSERT INTO `receipts` (`id`, `receipt_no`, `receipt_type`, `reference_id`, `customer_id`, `loan_id`, `receipt_data_json`, `generated_at`) VALUES (23, 'RCP-20261022-R3NVN', 'PAYMENT', '21', 6, 13, '[object Object]', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');

CREATE TABLE `release_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `release_id` int NOT NULL,
  `gold_item_id` int NOT NULL,
  `item_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purity` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight` decimal(8,3) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `release_id` (`release_id`),
  KEY `gold_item_id` (`gold_item_id`),
  CONSTRAINT `release_items_ibfk_1` FOREIGN KEY (`release_id`) REFERENCES `partial_releases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `release_items_ibfk_2` FOREIGN KEY (`gold_item_id`) REFERENCES `gold_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `release_items` (`id`, `release_id`, `gold_item_id`, `item_name`, `purity`, `weight`, `created_at`) VALUES (1, 1, 5, '22K Designer Gold Ring', '22K', '8.500', 'Thu Oct 22 2026 11:12:01 GMT+0530 (India Standard Time)');
INSERT INTO `release_items` (`id`, `release_id`, `gold_item_id`, `item_name`, `purity`, `weight`, `created_at`) VALUES (3, 3, 10, '22K Gold Bangle', '22K', '24.800', 'Thu Oct 22 2026 15:17:14 GMT+0530 (India Standard Time)');
INSERT INTO `release_items` (`id`, `release_id`, `gold_item_id`, `item_name`, `purity`, `weight`, `created_at`) VALUES (4, 4, 6, '925 Silver Anklet Pair', 'SILVER_925', '120.000', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');
INSERT INTO `release_items` (`id`, `release_id`, `gold_item_id`, `item_name`, `purity`, `weight`, `created_at`) VALUES (5, 6, 7, 'Chain', '24K', '40.000', 'Thu Oct 22 2026 15:32:18 GMT+0530 (India Standard Time)');

CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_permission` (`role_id`,`permission_id`),
  KEY `fk_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (1, 1, 3, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (2, 1, 5, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (3, 1, 4, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (4, 1, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (5, 1, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (6, 1, 7, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (7, 1, 9, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (8, 1, 8, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (9, 1, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (10, 1, 13, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (11, 1, 16, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (12, 1, 15, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (13, 1, 11, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (14, 1, 12, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (15, 1, 14, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (16, 1, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (17, 1, 20, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (18, 1, 18, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (19, 1, 19, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (20, 1, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (21, 1, 25, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (22, 1, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (23, 1, 23, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (24, 1, 22, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (25, 1, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (26, 1, 27, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (27, 1, 26, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (28, 1, 38, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (29, 1, 37, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (30, 1, 39, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (31, 1, 29, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (32, 1, 28, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (33, 1, 31, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (34, 1, 33, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (35, 1, 32, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (36, 1, 36, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (37, 1, 35, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (38, 1, 34, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (39, 1, 30, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (64, 2, 3, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (65, 2, 5, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (66, 2, 4, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (67, 2, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (68, 2, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (69, 2, 7, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (70, 2, 8, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (71, 2, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (72, 2, 13, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (73, 2, 16, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (74, 2, 15, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (75, 2, 11, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (76, 2, 12, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (77, 2, 14, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (78, 2, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (79, 2, 20, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (80, 2, 18, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (81, 2, 19, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (82, 2, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (83, 2, 25, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (84, 2, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (85, 2, 23, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (86, 2, 22, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (87, 2, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (88, 2, 27, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (89, 2, 26, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (90, 2, 38, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (91, 2, 37, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (92, 2, 39, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (93, 2, 29, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (94, 2, 28, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (95, 2, 31, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (96, 2, 33, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (97, 2, 32, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (98, 2, 35, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (99, 2, 34, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (100, 2, 30, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (127, 3, 3, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (128, 3, 4, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (129, 3, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (130, 3, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (131, 3, 7, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (132, 3, 8, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (133, 3, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (134, 3, 13, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (135, 3, 16, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (136, 3, 15, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (137, 3, 11, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (138, 3, 12, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (139, 3, 14, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (140, 3, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (141, 3, 20, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (142, 3, 18, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (143, 3, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (144, 3, 25, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (145, 3, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (146, 3, 23, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (147, 3, 22, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (148, 3, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (149, 3, 27, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (150, 3, 26, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (158, 4, 3, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (159, 4, 4, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (160, 4, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (161, 4, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (162, 4, 7, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (163, 4, 8, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (164, 4, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (165, 4, 13, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (166, 4, 11, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (167, 4, 12, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (168, 4, 14, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (169, 4, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (170, 4, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (171, 4, 25, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (172, 4, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (173, 4, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (189, 5, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (190, 5, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (191, 5, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (192, 5, 18, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (193, 5, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (194, 5, 25, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (195, 5, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (196, 6, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (197, 6, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (198, 6, 7, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (199, 6, 8, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (200, 6, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (201, 6, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (202, 6, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (203, 7, 3, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (204, 7, 4, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (205, 7, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (206, 7, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (207, 7, 7, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (208, 7, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (209, 7, 11, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (210, 7, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (211, 7, 18, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (212, 7, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (213, 7, 25, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (214, 7, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (215, 7, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (218, 8, 2, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (219, 8, 1, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (220, 8, 6, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (221, 8, 10, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (222, 8, 17, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (223, 8, 24, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (224, 8, 21, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`) VALUES (225, 8, 26, 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)');

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (1, 'SUPER_ADMIN', 'Super Administrator', 'Complete ERP access including security and system administration.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (2, 'ADMIN', 'Administrator', 'Full operational ERP access and user management.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (3, 'MANAGER', 'Manager', 'Branch management and approval access.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (4, 'LOAN_OFFICER', 'Loan Officer', 'Customer, gold and loan operations.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (5, 'CASHIER', 'Cashier', 'Payment and receipt operations.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (6, 'GOLD_APPRAISER', 'Gold Appraiser', 'Gold collateral assessment and inventory operations.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (7, 'STAFF', 'Staff', 'Basic operational access.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);
INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`) VALUES (8, 'VIEWER', 'Viewer', 'Read-only ERP access.', 1, 'ACTIVE', 'Thu Oct 22 2026 10:53:37 GMT+0530 (India Standard Time)', NULL);

CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES (1, 'shop_name', 'GOLD & SILVER PAWN LOAN MANAGEMENT ERP', 'Thu Oct 22 2026 16:13:50 GMT+0530 (India Standard Time)');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES (2, 'shop_address', 'Main Market Road, Commercial Complex, Branch 1', 'Thu Oct 22 2026 16:13:50 GMT+0530 (India Standard Time)');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES (3, 'shop_phone', '+91 98765 43210', 'Thu Oct 22 2026 16:13:50 GMT+0530 (India Standard Time)');
INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `updated_at`) VALUES (4, 'default_interest_rate', '2.00', 'Thu Oct 22 2026 16:13:50 GMT+0530 (India Standard Time)');

CREATE TABLE `user_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_permission` (`user_id`,`permission_id`),
  KEY `fk_user_permissions_permission` (`permission_id`),
  KEY `fk_user_permissions_admin` (`assigned_by`),
  CONSTRAINT `fk_user_permissions_admin` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_role` (`user_id`,`role_id`),
  KEY `fk_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `user_roles` (`id`, `user_id`, `role_id`, `assigned_by`, `assigned_at`) VALUES (1, 1, 2, 1, 'Thu Oct 22 2026 11:09:06 GMT+0530 (India Standard Time)');

CREATE TABLE `user_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `status` enum('ACTIVE','EXPIRED','REVOKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `idx_session_user` (`user_id`),
  KEY `idx_session_status` (`status`),
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','STAFF') COLLATE utf8mb4_unicode_ci DEFAULT 'STAFF',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE',
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login_device` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_mobile` (`mobile`),
  KEY `idx_users_email` (`email`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `mobile`, `email`, `employee_id`, `department`, `designation`, `role`, `status`, `failed_login_attempts`, `locked_until`, `last_login_at`, `last_login_ip`, `last_login_device`, `created_by`, `created_at`, `updated_at`) VALUES (1, 'admin', '$2b$10$ncKkUr3iPYJAi2eimx7TYeYVYq2.oEsiEc2Wkg2w0h2EjPBcZ2Rsq', 'Senior Branch Administrator', NULL, NULL, NULL, NULL, NULL, 'ADMIN', 'ACTIVE', 0, NULL, 'Thu Oct 22 2026 14:20:52 GMT+0530 (India Standard Time)', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', NULL, 'Thu Oct 22 2026 11:09:05 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 16:12:45 GMT+0530 (India Standard Time)');
INSERT INTO `users` (`id`, `username`, `password_hash`, `full_name`, `mobile`, `email`, `employee_id`, `department`, `designation`, `role`, `status`, `failed_login_attempts`, `locked_until`, `last_login_at`, `last_login_ip`, `last_login_device`, `created_by`, `created_at`, `updated_at`) VALUES (6, 'prabhas', '$2b$10$2GJ6rb9k6Dq9JiD42C9KZuK3/hw/2bAIMdcemWGyx8e6xB3qcd4Xe', 'Prabhas', '9345834909', NULL, NULL, 'NA', 'NA', 'STAFF', 'ACTIVE', 0, NULL, NULL, NULL, NULL, NULL, 'Thu Oct 22 2026 15:29:28 GMT+0530 (India Standard Time)', 'Thu Oct 22 2026 15:51:11 GMT+0530 (India Standard Time)');

