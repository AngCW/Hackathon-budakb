<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

error_reporting(E_ALL);
ini_set('display_errors', 1);

$uploadsDir = __DIR__ . '/../Uploads';
if (!is_dir($uploadsDir)) { @mkdir($uploadsDir, 0755, true); }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $user = $_GET['user'] ?? '';
  if ($user === '') { http_response_code(400); echo json_encode(['error'=>'Missing user']); exit; }
  $san = preg_replace('/[^a-zA-Z0-9_-]/','_',$user);
  $file = $uploadsDir . '/' . $san . '/it_status.json';
  if (!file_exists($file)) { echo json_encode(['prepared'=>false]); exit; }
  $data = json_decode(@file_get_contents($file), true) ?: [];
  echo json_encode([
    'prepared' => !empty($data['prepared']),
    'ticket' => $data['ticket'] ?? null,
    'updated' => $data['updated'] ?? null,
  ]);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  if (!$input || empty($input['userName'])) { http_response_code(400); echo json_encode(['error'=>'Missing userName']); exit; }
  $user = $input['userName'];
  $prepared = !empty($input['prepared']);
  $ticket = $input['ticket'] ?? null;
  $san = preg_replace('/[^a-zA-Z0-9_-]/','_',$user);
  $userDir = $uploadsDir . '/' . $san;
  if (!is_dir($userDir)) { @mkdir($userDir, 0755, true); }
  $file = $userDir . '/it_status.json';
  $payload = [
    'prepared' => $prepared,
    'ticket' => $ticket,
    'updated' => date('Y-m-d H:i:s')
  ];
  if (@file_put_contents($file, json_encode($payload, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500); echo json_encode(['error'=>'Failed to save status']); exit;
  }
  echo json_encode(['success'=>true]);
  exit;
}

http_response_code(405);
echo json_encode(['error'=>'Method not allowed']);
?>


