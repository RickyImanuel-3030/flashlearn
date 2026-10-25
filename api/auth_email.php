<?php
/** API: Registrasi atau login akun email dengan password yang di-hash. */
require_once __DIR__ . '/db.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$email = strtolower(trim($input['email'] ?? ''));
$password = (string) ($input['password'] ?? '');
$action = strtolower(trim($input['action'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Gunakan email valid dan password minimal 6 karakter.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, email, name, avatar, password_hash FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($action === 'login') {
        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Akun belum terdaftar. Silakan klik Buat Akun.']);
            exit;
        }
        if ($user['password_hash'] && !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Password tidak sesuai.']);
            exit;
        }
    } elseif ($action === 'register') {
        if ($user) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'Email ini sudah terdaftar. Silakan klik Masuk.']);
            exit;
        }
        $name = ucwords(str_replace(['.', '_', '-'], ' ', explode('@', $email)[0]));
        $avatar = 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=ff6b35&color=fff&rounded=true&size=128';
        $insert = $pdo->prepare('INSERT INTO users (email, name, avatar, password_hash) VALUES (?, ?, ?, ?)');
        $insert->execute([$email, $name, $avatar, password_hash($password, PASSWORD_DEFAULT)]);
        $user = ['id' => $pdo->lastInsertId(), 'email' => $email, 'name' => $name, 'avatar' => $avatar];
    } else {
        // Fallback auto-mode
        if (!$user) {
            $name = ucwords(str_replace(['.', '_', '-'], ' ', explode('@', $email)[0]));
            $avatar = 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=ff6b35&color=fff&rounded=true&size=128';
            $insert = $pdo->prepare('INSERT INTO users (email, name, avatar, password_hash) VALUES (?, ?, ?, ?)');
            $insert->execute([$email, $name, $avatar, password_hash($password, PASSWORD_DEFAULT)]);
            $user = ['id' => $pdo->lastInsertId(), 'email' => $email, 'name' => $name, 'avatar' => $avatar];
        } elseif (!$user['password_hash']) {
            $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
        } elseif (!password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Email atau password tidak sesuai.']);
            exit;
        }
    }

    session_regenerate_id(true);
    $_SESSION['flashlearn_user_email'] = $user['email'];
    echo json_encode(['success' => true, 'action' => $action, 'user' => [
        'id' => $user['id'], 'email' => $user['email'], 'name' => $user['name'], 'avatar' => $user['avatar']
    ]]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server gagal memproses akun.']);
}
