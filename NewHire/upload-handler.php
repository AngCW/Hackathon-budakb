<?php
// File Upload Handler for NewHire Onboarding
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Check if it's a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get the uploaded file
if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['document'];
$documentId = $_POST['documentId'] ?? 'unknown';
$userName = $_POST['userName'] ?? 'default_user';

// Validate file
$allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
$maxSize = 10 * 1024 * 1024; // 10MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG files.']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 10MB.']);
    exit;
}

// Create uploads directory structure
$uploadsDir = '../Uploads';
$userDir = $uploadsDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName);
$documentDir = $userDir . '/documents';

// Create directories if they don't exist
if (!is_dir($uploadsDir)) {
    if (!mkdir($uploadsDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create uploads directory']);
        exit;
    }
}

if (!is_dir($userDir)) {
    if (!mkdir($userDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user directory']);
        exit;
    }
}

if (!is_dir($documentDir)) {
    if (!mkdir($documentDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create documents directory']);
        exit;
    }
}

// Preserve original filename with conflict resolution
$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$originalFilename = pathinfo($file['name'], PATHINFO_FILENAME);
$filename = $originalFilename . '.' . $fileExtension;
$uploadPath = $documentDir . '/' . $filename;

// Handle filename conflicts by adding a counter if file already exists
$counter = 1;
while (file_exists($uploadPath)) {
    $filename = $originalFilename . '_' . $counter . '.' . $fileExtension;
    $uploadPath = $documentDir . '/' . $filename;
    $counter++;
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    // File uploaded successfully
    $response = [
        'success' => true,
        'message' => 'File uploaded successfully',
        'filename' => $filename,
        'originalName' => $file['name'],
        'size' => $file['size'],
        'type' => $file['type'],
        'uploadPath' => $uploadPath,
        'userName' => $userName,
        'documentId' => $documentId,
        'folderPath' => $userDir
    ];
    
    // Log the upload
    $logEntry = date('Y-m-d H:i:s') . " - User: $userName, Document: $documentId, Original File: " . $file['name'] . ", Saved As: $filename, Size: " . $file['size'] . " bytes, Path: $uploadPath\n";
    file_put_contents($userDir . '/upload_log.txt', $logEntry, FILE_APPEND | LOCK_EX);
    
    // Create a user info file
    $userInfo = [
        'userName' => $userName,
        'created' => date('Y-m-d H:i:s'),
        'totalUploads' => 1,
        'lastUpload' => date('Y-m-d H:i:s')
    ];
    file_put_contents($userDir . '/user_info.json', json_encode($userInfo, JSON_PRETTY_PRINT));
    
    echo json_encode($response);
} else {
    // Upload failed
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
?>
