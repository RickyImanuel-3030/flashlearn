<?php
/** API: Ambil progres belajar berdasarkan email akun. */
require_once __DIR__ . '/db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$email = trim($_GET['email'] ?? '');
if ($email === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email wajib diisi']);
    exit;
}

if (empty($_SESSION['flashlearn_user_email']) || $_SESSION['flashlearn_user_email'] !== $email) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesi akun tidak valid']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT studied_cards, scores FROM user_progress WHERE user_email = ? LIMIT 1');
    $stmt->execute([$email]);
    $progress = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'found' => (bool) $progress,
        'studied_cards' => $progress ? (json_decode($progress['studied_cards'], true) ?: []) : [],
        'scores' => $progress ? (json_decode($progress['scores'], true) ?: []) : []
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
