<?php
require_once __DIR__ . '/db.php';
session_start();
$_SESSION = [];
session_destroy();
echo json_encode(['success' => true]);
