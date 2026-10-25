<?php
/** API: Simpan progres belajar berdasarkan email akun. */
require_once __DIR__ . '/db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$studiedCards = is_array($input['studied_cards'] ?? null) ? array_values($input['studied_cards']) : [];
$scores = is_array($input['scores'] ?? null) ? array_values($input['scores']) : [];

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
    $userStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $userStmt->execute([$email]);
    $user = $userStmt->fetch();

    $stmt = $pdo->prepare('INSERT INTO user_progress (user_id, user_email, studied_cards, scores)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), studied_cards = VALUES(studied_cards), scores = VALUES(scores)');
    $stmt->execute([
        $user['id'] ?? null,
        $email,
        json_encode($studiedCards, JSON_UNESCAPED_UNICODE),
        json_encode($scores, JSON_UNESCAPED_UNICODE)
    ]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
