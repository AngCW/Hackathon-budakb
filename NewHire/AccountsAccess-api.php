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
$talentsFile = __DIR__ . '/../Uploads/talents.json';
if (!file_exists($talentsFile)) { @file_put_contents($talentsFile, json_encode([], JSON_PRETTY_PRINT)); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['userName'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing userName']);
  exit;
}

$userName = $input['userName'];
$sanitizedUser = preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName);
$userDir = $uploadsDir . '/' . $sanitizedUser;
@mkdir($userDir, 0755, true);

$profile = [
  'firstName' => $input['firstName'] ?? '',
  'lastName' => $input['lastName'] ?? '',
  'gender' => $input['gender'] ?? '',
  'birthdate' => $input['birthdate'] ?? '',
  'bios' => $input['bios'] ?? '',
  'feedback' => $input['feedback'] ?? ''
];

$profileFile = $userDir . '/profile.json';
if (@file_put_contents($profileFile, json_encode($profile, JSON_PRETTY_PRINT)) === false) {
  http_response_code(500);
  echo json_encode(['error' => 'Failed to save details']);
  exit;
}

if (!empty($profile['feedback'])) {
  $talents = json_decode(@file_get_contents($talentsFile), true) ?: [];
  $updated = false;
  foreach ($talents as &$t) {
    if (!empty($t['userName']) && strcasecmp($t['userName'], $userName) === 0) {
      $t['feedback'] = $profile['feedback'];
      $updated = true;
      break;
    }
  }
  if ($updated) {
    @file_put_contents($talentsFile, json_encode($talents, JSON_PRETTY_PRINT));
  }
}

echo json_encode(['success' => true, 'message' => 'Details saved', 'profile' => $profile]);
