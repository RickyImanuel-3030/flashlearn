-- ========================================================
-- FlashLearn HTML - Database Schema for Laragon MySQL
-- Database: flashlearn_db
-- ========================================================

CREATE DATABASE IF NOT EXISTS `flashlearn_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `flashlearn_db`;

-- Tabel Pengguna (Login Email dan Password)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `google_id` VARCHAR(255) NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `name` VARCHAR(255) NOT NULL,
    `avatar` TEXT NULL,
    `password_hash` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Database lama akan dimigrasikan otomatis oleh api/db.php saat aplikasi dijalankan.

-- Tabel Skor Quiz
CREATE TABLE IF NOT EXISTS `quiz_scores` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `user_email` VARCHAR(255) DEFAULT 'guest',
    `user_name` VARCHAR(255) DEFAULT 'Tamu',
    `score` INT NOT NULL,
    `total_questions` INT NOT NULL DEFAULT 5,
    `percentage` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_user_email` (`user_email`),
    INDEX `idx_percentage` (`percentage` DESC),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Progres akun tersinkron antar sesi/perangkat
CREATE TABLE IF NOT EXISTS `user_progress` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL,
    `user_email` VARCHAR(255) NOT NULL UNIQUE,
    `studied_cards` JSON NOT NULL,
    `scores` JSON NOT NULL,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_progress_user` (`user_email`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data Awal Dummy untuk Leaderboard
INSERT INTO `quiz_scores` (`user_name`, `user_email`, `score`, `total_questions`, `percentage`) 
VALUES 
('Budi Santoso', 'budi@example.com', 5, 5, 100),
('Siti Rahma', 'siti@example.com', 4, 5, 80),
('Ahmad Fauzi', 'ahmad@example.com', 4, 5, 80)
ON DUPLICATE KEY UPDATE `score` = VALUES(`score`);
