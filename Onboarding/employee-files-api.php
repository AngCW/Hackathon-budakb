<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 1);

error_log("Employee Files API called: " . $_SERVER['REQUEST_METHOD'] . " - " . date('Y-m-d H:i:s'));

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$userName = $_GET['user'] ?? '';

if (empty($userName)) {
    http_response_code(400);
    echo json_encode(['error' => 'Employee name is required']);
    exit;
}

getEmployeeFiles($userName);

function getEmployeeFiles($userName) {
    $uploadsDir = '../Uploads';
    $userDir = $uploadsDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName);
    $documentsDir = $userDir . '/documents';
    
    error_log("Getting files for employee: $userName from directory: $documentsDir");
    
    if (!is_dir($userDir)) {
        error_log("Employee directory does not exist: $userDir");
        echo json_encode([
            'success' => true,
            'files' => [],
            'message' => 'No files found for this employee'
        ]);
        return;
    }
    
    if (!is_dir($documentsDir)) {
        error_log("Documents directory does not exist: $documentsDir");
        echo json_encode([
            'success' => true,
            'files' => [],
            'message' => 'No documents directory found for this employee'
        ]);
        return;
    }
    
    try {
        $files = scanDirectory($documentsDir, $userName);
        $profile = loadProfile($userName);
        
        error_log("Found " . count($files) . " files for employee: $userName");
        echo json_encode([
            'success' => true,
            'files' => $files,
            'profile' => $profile,
            'message' => 'Files retrieved successfully'
        ]);
    } catch (Exception $e) {
        error_log("Error scanning directory: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to retrieve files'
        ]);
    }
}

function scanDirectory($dir, $userName) {
    $files = [];
    $items = scandir($dir);
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        
        $path = $dir . '/' . $item;
        
        if (is_file($path)) {
            $fileInfo = getFileInfo($path, $userName);
            if ($fileInfo) {
                $files[] = $fileInfo;
            }
        }
    }
    
    usort($files, function($a, $b) {
        return strtotime($b['uploadDate']) - strtotime($a['uploadDate']);
    });
    
    return $files;
}

function getFileInfo($filePath, $userName) {
    if (!file_exists($filePath)) {
        return null;
    }
    
    $fileName = basename($filePath);
    $fileSize = filesize($filePath);
    $fileTime = filemtime($filePath);
    
    $relativePath = '../Uploads/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName) . '/documents/' . $fileName;
    
    return [
        'name' => $fileName,
        'size' => $fileSize,
        'uploadDate' => date('Y-m-d H:i:s', $fileTime),
        'path' => $relativePath,
        'type' => mime_content_type($filePath)
    ];
}

function loadProfile($userName) {
    $path = '../Uploads/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName) . '/profile.json';
    if (file_exists($path)) {
        $json = file_get_contents($path);
        $data = json_decode($json, true);
        if (is_array($data)) return $data;
    }
    return null;
}
?>
