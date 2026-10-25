<?php
/**
 * API: Simpan Skor Quiz ke Database Laragon
 */
require_once __DIR__ . '/db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payload JSON tidak valid']);
    exit;
}

$score = isset($input['score']) ? intval($input['score']) : 0;
$total = isset($input['total']) ? intval($input['total']) : 5;
$percentage = isset($input['percentage']) ? intval($input['percentage']) : round(($score / max($total, 1)) * 100);
$user_email = !empty($input['user_email']) ? trim($input['user_email']) : 'guest';
$user_name = !empty($input['user_name']) ? trim($input['user_name']) : 'Tamu';

if ($user_email !== 'guest' && (empty($_SESSION['flashlearn_user_email']) || $_SESSION['flashlearn_user_email'] !== $user_email)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Sesi akun tidak valid']);
    exit;
}

try {
    // Cari user_id jika ada
    $stmtUser = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmtUser->execute([$user_email]);
    $user = $stmtUser->fetch();
    $user_id = $user ? $user['id'] : null;

    $stmt = $pdo->prepare("
        INSERT INTO quiz_scores (user_id, user_email, user_name, score, total_questions, percentage)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$user_id, $user_email, $user_name, $score, $total, $percentage]);

    $lastId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Skor berhasil disimpan ke database Laragon!',
        'data' => [
            'id' => $lastId,
            'user_name' => $user_name,
            'percentage' => $percentage
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal menyimpan skor: ' . $e->getMessage()
    ]);
}
