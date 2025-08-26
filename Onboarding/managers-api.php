<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$file = realpath(__DIR__ . '/../Uploads') . DIRECTORY_SEPARATOR . 'managers.json';
if (!file_exists($file)) {
  @mkdir(dirname($file), 0777, true);
  file_put_contents($file, json_encode([ 'managers' => [] ], JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $data = json_decode(file_get_contents($file), true);
  if (!$data) { $data = [ 'managers' => [] ]; }
  echo json_encode($data);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  if (isset($input['action']) && strtolower($input['action']) === 'delete') {
    $name = isset($input['name']) ? $input['name'] : null;
    $id = isset($input['id']) ? $input['id'] : null;
    $data = json_decode(file_get_contents($file), true);
    if (!$data) { $data = [ 'managers' => [] ]; }
    $before = count($data['managers']);
    $data['managers'] = array_values(array_filter($data['managers'], function($m) use ($name, $id) {
      if ($id) return $m['id'] !== $id;
      if ($name) return $m['name'] !== $name;
      return true;
    }));
    $after = count($data['managers']);
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode([ 'success' => true, 'removed' => $before - $after ]);
    exit;
  } else {
    if (!$input || !isset($input['name']) || !isset($input['role'])) {
      http_response_code(400);
      echo json_encode([ 'error' => 'Missing fields: name, role' ]);
      exit;
    }
    $data = json_decode(file_get_contents($file), true);
    if (!$data) { $data = [ 'managers' => [] ]; }
    $managers = $data['managers'];
    $id = isset($input['id']) && $input['id'] !== '' ? $input['id'] : uniqid('m');
    $manager = [ 'id' => $id, 'name' => $input['name'], 'role' => $input['role'] ];
    $managers[] = $manager;
    $data['managers'] = $managers;
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode([ 'success' => true, 'manager' => $manager ]);
    exit;
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $raw = file_get_contents('php://input');
  $input = json_decode($raw, true);
  $name = isset($input['name']) ? $input['name'] : null;
  $id = isset($input['id']) ? $input['id'] : null;
  $data = json_decode(file_get_contents($file), true);
  if (!$data) { $data = [ 'managers' => [] ]; }
  $before = count($data['managers']);
  $data['managers'] = array_values(array_filter($data['managers'], function($m) use ($name, $id) {
    if ($id) return $m['id'] !== $id;
    if ($name) return $m['name'] !== $name;
    return true;
  }));
  $after = count($data['managers']);
  file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
  echo json_encode([ 'success' => true, 'removed' => $before - $after ]);
  exit;
}

http_response_code(405);
echo json_encode([ 'error' => 'Method not allowed' ]);
?>


