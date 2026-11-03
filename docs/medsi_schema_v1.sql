-- MedSi schema v1.1 (MySQL 8.0, InnoDB, utf8mb4). Sinh tu schema_spec.py. Chua chay thu tren MySQL that.
--
-- ROLE (users.role), khop 5 cot cua AUTH_RBAC:
--   guest   : Khach, KHONG co tai khoan, khong luu trong DB (chi xem danh muc, dang ky, dang nhap)
--   patient : Benh nhan, chi thay du lieu cua minh
--   doctor  : Bac si, gan doctors.user_id, chi thay lich cua minh
--   staff   : Nhan vien co so, BAT BUOC users.hospital_id, chi thao tac va quet QR check-in tai co so cua minh
--   admin   : Quan tri he thong, hospital_id phai de trong

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Tai khoan dang nhap. role: patient, doctor, staff (gan hospital_id), admin. Khach (guest) 
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `role` ENUM('patient','doctor','staff','admin') NOT NULL DEFAULT 'patient',
  `status` ENUM('pending','active','locked','disabled') NOT NULL DEFAULT 'active',
  `hospital_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `failed_login_count` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `locked_until` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `ix_users_role` (`role`, `status`),
  KEY `ix_users_hospital` (`hospital_id`),
  CONSTRAINT `fk_users_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_users_scope` CHECK ((role = 'staff' AND hospital_id IS NOT NULL) OR (role <> 'staff' AND hospital_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ho so nguoi duoc kham. deleted_at co gia tri = luu tru (ARCHIVED).
CREATE TABLE `patient_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `dob` DATE NOT NULL,
  `gender` ENUM('male','female','other') NOT NULL,
  `phone` VARCHAR(20) NULL DEFAULT NULL,
  `relationship` VARCHAR(50) NOT NULL,
  `identity_card_number` VARCHAR(20) NULL DEFAULT NULL,
  `health_insurance_code` VARCHAR(20) NULL DEFAULT NULL,
  `guardian_name` VARCHAR(150) NULL DEFAULT NULL,
  `guardian_phone` VARCHAR(20) NULL DEFAULT NULL,
  `guardian_relationship` VARCHAR(50) NULL DEFAULT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT 0,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profile_user_cccd` (`user_id`, `identity_card_number`),
  KEY `ix_profile_user` (`user_id`, `deleted_at`),
  CONSTRAINT `fk_patient_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bang chung dong y. patient_profile_id KHONG rang FK cung de giu lai khi ho so bi xoa cung (CF-05).
CREATE TABLE `patient_consents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `patient_profile_id` BIGINT UNSIGNED NOT NULL,
  `policy_version` VARCHAR(20) NOT NULL,
  `is_agreed` BOOLEAN NOT NULL,
  `agreed_at` DATETIME NOT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` TEXT NULL,
  `revoked_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_consent_profile` (`patient_profile_id`),
  CONSTRAINT `fk_patient_consents_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chuyen khoa. code dung cho STT (vi du CK03).
CREATE TABLE `specialties` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `default_instructions` TEXT NULL,
  `image` VARCHAR(255) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_spec_code` (`code`),
  UNIQUE KEY `uq_spec_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Co so y te (benh vien, phong kham).
CREATE TABLE `hospitals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10,7) NULL DEFAULT NULL,
  `longitude` DECIMAL(10,7) NULL DEFAULT NULL,
  `hotline` VARCHAR(20) NULL DEFAULT NULL,
  `image` VARCHAR(255) NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_hospital_city` (`city`),
  CONSTRAINT `ck_hospital_lat` CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT `ck_hospital_lng` CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bac si. user_id cho phep bac si dang nhap.
CREATE TABLE `doctors` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `specialty_id` BIGINT UNSIGNED NOT NULL,
  `hospital_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `title` VARCHAR(50) NULL DEFAULT NULL,
  `years_experience` TINYINT UNSIGNED NULL DEFAULT NULL,
  `bio` TEXT NULL,
  `city` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NULL DEFAULT NULL,
  `latitude` DECIMAL(10,7) NULL DEFAULT NULL,
  `longitude` DECIMAL(10,7) NULL DEFAULT NULL,
  `consultation_fee` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `avatar` VARCHAR(255) NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_user` (`user_id`),
  KEY `ix_doctor_spec` (`specialty_id`),
  KEY `ix_doctor_city` (`city`),
  KEY `ix_doctor_hospital` (`hospital_id`),
  CONSTRAINT `fk_doctors_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_doctors_specialty_id` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_doctors_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_doctor_fee` CHECK (consultation_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loai kham cua benh vien (gia, chuyen khoa).
CREATE TABLE `exam_types` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `hospital_id` BIGINT UNSIGNED NOT NULL,
  `specialty_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `price` DECIMAL(12,0) NOT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_exam_hospital` (`hospital_id`),
  CONSTRAINT `fk_exam_types_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exam_types_specialty_id` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_exam_price` CHECK (price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khung gio. owner_type/owner_id da hinh (khong FK cung). Bac si: slot 30 phut; benh vien: slot cap ca.
CREATE TABLE `slots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_type` ENUM('doctor','hospital') NOT NULL,
  `owner_id` BIGINT UNSIGNED NOT NULL,
  `specialty_id` BIGINT UNSIGNED NOT NULL,
  `work_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `capacity` INT UNSIGNED NOT NULL DEFAULT 1,
  `booked_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('available','full','blocked') NOT NULL DEFAULT 'available',
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slot` (`owner_type`, `owner_id`, `specialty_id`, `work_date`, `start_time`),
  KEY `ix_slot_owner` (`owner_type`, `owner_id`, `work_date`),
  KEY `ix_slot_date` (`work_date`, `status`),
  CONSTRAINT `fk_slots_specialty_id` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_slot_count` CHECK (booked_count <= capacity),
  CONSTRAINT `ck_slot_cap` CHECK (capacity >= 1),
  CONSTRAINT `ck_slot_time` CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lich kham (appointment). 9 trang thai theo STM-BKD-01. patient_snapshot luu ban chup ho so da che.
CREATE TABLE `bookings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `patient_profile_id` BIGINT UNSIGNED NOT NULL,
  `booking_type` ENUM('doctor','hospital') NOT NULL,
  `doctor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `hospital_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `exam_type_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `slot_id` BIGINT UNSIGNED NOT NULL,
  `symptoms` VARCHAR(500) NULL DEFAULT NULL,
  `patient_snapshot` JSON NOT NULL,
  `status` ENUM('pending_payment','pending_approval','confirmed','checked_in','completed','cancelled','expired','rejected','no_show') NOT NULL DEFAULT 'pending_payment',
  `hold_expires_at` DATETIME NULL DEFAULT NULL,
  `approval_expires_at` DATETIME NULL DEFAULT NULL,
  `decided_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `decided_at` DATETIME NULL DEFAULT NULL,
  `reject_reason` VARCHAR(255) NULL DEFAULT NULL,
  `cancelled_at` DATETIME NULL DEFAULT NULL,
  `cancelled_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `cancel_reason_code` VARCHAR(30) NULL DEFAULT NULL,
  `cancel_reason` VARCHAR(255) NULL DEFAULT NULL,
  `request_key` VARCHAR(64) NULL DEFAULT NULL,
  `version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_booking_code` (`code`),
  UNIQUE KEY `uq_booking_request` (`user_id`, `request_key`),
  KEY `ix_booking_user` (`user_id`),
  KEY `ix_booking_hold` (`status`, `hold_expires_at`),
  KEY `ix_booking_approval` (`status`, `approval_expires_at`),
  KEY `ix_booking_slot` (`slot_id`),
  KEY `ix_booking_profile` (`patient_profile_id`, `status`),
  CONSTRAINT `fk_bookings_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_patient_profile_id` FOREIGN KEY (`patient_profile_id`) REFERENCES `patient_profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_doctor_id` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_hospital_id` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_exam_type_id` FOREIGN KEY (`exam_type_id`) REFERENCES `exam_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_slot_id` FOREIGN KEY (`slot_id`) REFERENCES `slots` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_decided_by` FOREIGN KEY (`decided_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_bookings_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_booking_type` CHECK ((booking_type = 'doctor' AND doctor_id IS NOT NULL AND hospital_id IS NULL AND exam_type_id IS NULL) OR (booking_type = 'hospital' AND hospital_id IS NOT NULL AND exam_type_id IS NOT NULL AND doctor_id IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Don thanh toan, 1 lich 1 don. Tien VND so nguyen. total_amount do server tinh.
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `method` ENUM('atm','credit_card','qr_pay','store_pay','momo') NULL DEFAULT NULL,
  `exam_fee` DECIMAL(12,0) NOT NULL,
  `discount_amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `service_fee` DECIMAL(12,0) NOT NULL,
  `total_amount` DECIMAL(12,0) NOT NULL,
  `received_amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `refunded_amount` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `status` ENUM('pending','paid','failed','cancelled','expired','refunded') NOT NULL DEFAULT 'pending',
  `paid_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_booking` (`booking_id`),
  CONSTRAINT `fk_payments_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_pay_total` CHECK (total_amount = exam_fee - discount_amount + service_fee),
  CONSTRAINT `ck_pay_discount` CHECK (discount_amount >= 0 AND discount_amount <= exam_fee),
  CONSTRAINT `ck_pay_refund` CHECK (refunded_amount >= 0 AND refunded_amount <= received_amount),
  CONSTRAINT `ck_pay_received` CHECK (received_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moi lan thu tien. transaction_code unique de callback idempotent.
CREATE TABLE `payment_transactions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `transaction_code` VARCHAR(64) NOT NULL,
  `amount` DECIMAL(12,0) NOT NULL,
  `status` ENUM('success','failed','pending') NOT NULL,
  `source` ENUM('gateway','demo_admin','counter') NOT NULL,
  `received_at` DATETIME NOT NULL,
  `raw_payload` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_txn_code` (`transaction_code`),
  KEY `ix_txn_payment` (`payment_id`),
  CONSTRAINT `fk_payment_transactions_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_txn_amount` CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Yeu cau hoan tien (STM-PAY-02). requested_by NULL = he thong. policy_case = dong PAY_POLICY.
CREATE TABLE `refunds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(12,0) NOT NULL,
  `exam_fee_refunded` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `service_fee_refunded` DECIMAL(12,0) NOT NULL DEFAULT 0,
  `policy_case` VARCHAR(40) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `status` ENUM('requested','approved','processing','rejected','failed','succeeded') NOT NULL DEFAULT 'requested',
  `refund_ref` VARCHAR(64) NOT NULL,
  `requested_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `approved_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `requested_at` DATETIME NOT NULL,
  `processed_at` DATETIME NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refund_ref` (`refund_ref`),
  KEY `ix_refund_booking` (`booking_id`),
  KEY `ix_refund_status` (`status`),
  CONSTRAINT `fk_refunds_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_refunds_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_refunds_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_refunds_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_refund_sum` CHECK (amount = exam_fee_refunded + service_fee_refunded),
  CONSTRAINT `ck_refund_pos` CHECK (amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Phieu kham. queue_scope = owner_type:owner_id:specialty_id:work_date. qr_token la JWT (512 ky tu).
CREATE TABLE `tickets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `booking_id` BIGINT UNSIGNED NOT NULL,
  `ticket_code` VARCHAR(32) NOT NULL,
  `qr_token` VARCHAR(512) NOT NULL,
  `queue_scope` VARCHAR(64) NOT NULL,
  `queue_seq` INT UNSIGNED NOT NULL,
  `queue_number` VARCHAR(20) NOT NULL,
  `room_number` VARCHAR(50) NULL DEFAULT NULL,
  `status` ENUM('issued','checked_in','completed','cancelled','expired') NOT NULL DEFAULT 'issued',
  `check_in_at` DATETIME NULL DEFAULT NULL,
  `instructions` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ticket_booking` (`booking_id`),
  UNIQUE KEY `uq_ticket_code` (`ticket_code`),
  UNIQUE KEY `uq_ticket_queue` (`queue_scope`, `queue_seq`),
  KEY `ix_ticket_status` (`status`),
  CONSTRAINT `fk_tickets_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nhat ky chi them, khong sua, khong xoa. Khong ghi du lieu nhay cam nguyen van.
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `actor_type` ENUM('user','system','gateway') NOT NULL,
  `action` VARCHAR(60) NOT NULL,
  `entity_type` VARCHAR(40) NOT NULL,
  `entity_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `reason` VARCHAR(255) NULL DEFAULT NULL,
  `changes` JSON NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `occurred_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_audit_entity` (`entity_type`, `entity_id`),
  KEY `ix_audit_actor` (`actor_id`, `occurred_at`),
  KEY `ix_audit_action` (`action`, `occurred_at`),
  CONSTRAINT `fk_audit_logs_actor_id` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;