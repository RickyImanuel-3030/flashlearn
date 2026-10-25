<?php
/**
 * API: Simpan / Login Pengguna Akun Google ke Database Laragon
 */
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email wajib diisi']);
    exit;
}

$email = trim($input['email']);
$name = !empty($input['name']) ? trim($input['name']) : explode('@', $email)[0];
$avatar = !empty($input['avatar']) ? trim($input['avatar']) : 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=ff6b35&color=fff';
$google_id = !empty($input['google_id']) ? trim($input['google_id']) : null;

try {
    // Cek apakah user sudah terdaftar
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        // Update user
        $stmtUpdate = $pdo->prepare("
            UPDATE users 
            SET name = ?, avatar = ?, google_id = COALESCE(?, google_id)
            WHERE id = ?
        ");
        $stmtUpdate->execute([$name, $avatar, $google_id, $user['id']]);
        $userId = $user['id'];
    } else {
        // Insert new user
        $stmtInsert = $pdo->prepare("
            INSERT INTO users (email, name, avatar, google_id)
            VALUES (?, ?, ?, ?)
        ");
        $stmtInsert->execute([$email, $name, $avatar, $google_id]);
        $userId = $pdo->lastInsertId();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login berhasil!',
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'avatar' => $avatar
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
