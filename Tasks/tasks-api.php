<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$file = realpath(__DIR__ . '/../Uploads') . DIRECTORY_SEPARATOR . 'tasks.json';
if (!file_exists($file)) {
  @mkdir(dirname($file), 0777, true);
  file_put_contents($file, json_encode([], JSON_PRETTY_PRINT));
}

function readTasks($file){
  $raw = file_get_contents($file);
  $data = json_decode($raw, true);
  return $data ?: [];
}
function writeTasks($file,$tasks){ file_put_contents($file, json_encode($tasks, JSON_PRETTY_PRINT)); }

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'GET') {
  echo json_encode(readTasks($file));
  exit;
}

if ($method === 'POST') {
  if (isset($_GET['action']) && $_GET['action'] === 'done') {
    $id = $_GET['id'] ?? '';
    $tasks = readTasks($file);
    foreach ($tasks as &$t) { if ($t['id'] === $id) { $t['done'] = true; } }
    writeTasks($file, $tasks);
    echo json_encode(['success'=>true]);
    exit;
  }
  $input = json_decode(file_get_contents('php://input'), true);
  if (!$input || !isset($input['title'])) { http_response_code(400); echo json_encode(['error'=>'Missing title']); exit; }
  $tasks = readTasks($file);
  $tasks[] = [
    'id' => uniqid('t'),
    'title' => $input['title'],
    'assignee' => $input['assignee'] ?? '',
    'priority' => $input['priority'] ?? 'Medium',
    'done' => false,
    'created' => date('c')
  ];
  writeTasks($file, $tasks);
  echo json_encode(['success'=>true]);
  exit;
}

if ($method === 'DELETE') {
  $input = json_decode(file_get_contents('php://input'), true);
  $id = $input['id'] ?? '';
  $tasks = readTasks($file);
  $tasks = array_values(array_filter($tasks, function($t) use ($id){ return $t['id'] !== $id; }));
  writeTasks($file, $tasks);
  echo json_encode(['success'=>true]);
  exit;
}

http_response_code(405);
echo json_encode(['error'=>'Method not allowed']);
?>


