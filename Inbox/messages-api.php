<?php
header('Content-Type: application/json');

$uploadsDir = realpath(__DIR__ . '/../Uploads');
$managersFile = $uploadsDir . DIRECTORY_SEPARATOR . 'managers.json';
$messagesFile = $uploadsDir . DIRECTORY_SEPARATOR . 'messages.json';

ensureFile($managersFile, json_encode([ 'managers' => [
  [ 'id' => 'm1', 'name' => 'Alex Morgan', 'role' => 'HR Manager' ],
  [ 'id' => 'm2', 'name' => 'Taylor Kim', 'role' => 'Operations Manager' ],
  [ 'id' => 'm3', 'name' => 'Jordan Lee', 'role' => 'Engineering Manager' ],
  [ 'id' => 'm4', 'name' => 'Sam Rivera', 'role' => 'People Partner' ],
] ], JSON_PRETTY_PRINT));

ensureFile($messagesFile, json_encode([ 'messages' => [] ], JSON_PRETTY_PRINT));

$action = isset($_GET['action']) ? $_GET['action'] : 'health';

switch ($action) {
  case 'health':
    echo json_encode([ 'ok' => true ]);
    break;

  case 'managers':
    $data = readJson($managersFile);
    echo json_encode([ 'managers' => isset($data['managers']) ? $data['managers'] : [] ]);
    break;

  case 'conversations':
    $userId = param('userId');
    if (!$userId) return badRequest('Missing userId');
    $messages = readJson($messagesFile)['messages'];
    $lastByPeer = [];
    foreach ($messages as $msg) {
      if ($msg['senderId'] === $userId) {
        $peer = $msg['recipientId'];
      } else if ($msg['recipientId'] === $userId) {
        $peer = $msg['senderId'];
      } else {
        continue;
      }
      if (!isset($lastByPeer[$peer]) || $msg['timestamp'] > $lastByPeer[$peer]['timestamp']) {
        $lastByPeer[$peer] = $msg;
      }
    }
    echo json_encode([ 'conversations' => $lastByPeer ]);
    break;

  case 'messages':
    $userId = param('userId');
    $withId = param('with');
    if (!$userId || !$withId) return badRequest('Missing userId/with');
    $messages = readJson($messagesFile)['messages'];
    $thread = array_values(array_filter($messages, function($m) use ($userId, $withId) {
      return ($m['senderId'] === $userId && $m['recipientId'] === $withId)
          || ($m['senderId'] === $withId && $m['recipientId'] === $userId);
    }));
    usort($thread, function($a, $b) { return strcmp($a['timestamp'], $b['timestamp']); });
    echo json_encode([ 'messages' => $thread ]);
    break;

  case 'send':
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload) return badRequest('Invalid JSON');
    $senderId = isset($payload['senderId']) ? $payload['senderId'] : null;
    $recipientId = isset($payload['recipientId']) ? $payload['recipientId'] : null;
    $content = isset($payload['content']) ? trim($payload['content']) : '';
    if (!$senderId || !$recipientId || $content === '') return badRequest('Missing fields');

    $data = readJson($messagesFile);
    $messages = $data['messages'];
    $message = [
      'id' => uniqid('msg_', true),
      'senderId' => $senderId,
      'recipientId' => $recipientId,
      'content' => $content,
      'timestamp' => gmdate('c'),
    ];
    $messages[] = $message;
    $data['messages'] = $messages;
    writeJson($messagesFile, $data);
    echo json_encode([ 'ok' => true, 'message' => $message ]);
    break;

  default:
    http_response_code(404);
    echo json_encode([ 'error' => 'Unknown action' ]);
}

function ensureFile($path, $defaultContent) {
  if (!file_exists($path)) {
    if (!is_dir(dirname($path))) {
      mkdir(dirname($path), 0777, true);
    }
    file_put_contents($path, $defaultContent);
  }
}

function readJson($path) {
  $raw = file_get_contents($path);
  $data = json_decode($raw, true);
  if (!is_array($data)) { $data = []; }
  return $data + [ 'messages' => [] ];
}

function writeJson($path, $data) {
  file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));
}

function param($key) {
  return isset($_GET[$key]) ? $_GET[$key] : null;
}

function badRequest($message) {
  http_response_code(400);
  echo json_encode([ 'error' => $message ]);
  return null;
}


