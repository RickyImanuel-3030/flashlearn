<?php
/**
 * FlashLearn HTML - Database Connection (Laragon MySQL)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = '127.0.0.1';
$port = '3306';
$user = 'root';
$pass = '';
$dbname = 'flashlearn_db';

try {
    // Koneksi awal tanpa memilih database agar bisa otomatis create database jika belum ada
    $pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Auto create database jika belum ada
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    // Auto create tables jika belum ada
    $pdo->exec("
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
            INDEX `idx_percentage` (`percentage` DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

        CREATE TABLE IF NOT EXISTS `user_progress` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NULL,
            `user_email` VARCHAR(255) NOT NULL UNIQUE,
            `studied_cards` JSON NOT NULL,
            `scores` JSON NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX `idx_progress_user` (`user_email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $hasPasswordColumn = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'password_hash'")->fetch();
    if (!$hasPasswordColumn) {
        $pdo->exec("ALTER TABLE `users` ADD COLUMN `password_hash` VARCHAR(255) NULL AFTER `avatar`");
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Koneksi database Laragon gagal: ' . $e->getMessage()
    ]);
    exit;
}
