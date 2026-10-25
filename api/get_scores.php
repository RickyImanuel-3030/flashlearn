<?php
/**
 * API: Ambil Leaderboard & Riwayat Skor dari Database Laragon
 */
require_once __DIR__ . '/db.php';

$email = isset($_GET['email']) ? trim($_GET['email']) : '';

try {
    // Ambil Top Leaderboard
    $stmtTop = $pdo->query("
        SELECT user_name, user_email, MAX(percentage) AS best_score, COUNT(*) AS total_quizzes, MAX(created_at) AS last_quiz
        FROM quiz_scores
        GROUP BY user_email, user_name
        ORDER BY best_score DESC, total_quizzes DESC
        LIMIT 10
    ");
    $leaderboard = $stmtTop->fetchAll();

    // Ambil riwayat skor pengguna jika email diberikan
    $userHistory = [];
    if (!empty($email)) {
        $stmtHistory = $pdo->prepare("
            SELECT score, total_questions, percentage, created_at
            FROM quiz_scores
            WHERE user_email = ?
            ORDER BY created_at DESC
            LIMIT 10
        ");
        $stmtHistory->execute([$email]);
        $userHistory = $stmtHistory->fetchAll();
    }

    echo json_encode([
        'success' => true,
        'leaderboard' => $leaderboard,
        'user_history' => $userHistory
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil skor: ' . $e->getMessage()
    ]);
}
