<?php
header('Content-Type: application/json');


error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['document'];
$documentId = $_POST['documentId'] ?? 'unknown';
$userName = $_POST['userName'] ?? 'default_user';

$allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
$maxSize = 10 * 1024 * 1024; 

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

$uploadsDir = '../Uploads';
$userDir = $uploadsDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName);
$documentDir = $userDir . '/documents';

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

$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$originalFilename = pathinfo($file['name'], PATHINFO_FILENAME);
$filename = $originalFilename . '.' . $fileExtension;
$uploadPath = $documentDir . '/' . $filename;

$counter = 1;
while (file_exists($uploadPath)) {
    $filename = $originalFilename . '_' . $counter . '.' . $fileExtension;
    $uploadPath = $documentDir . '/' . $filename;
    $counter++;
}

if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
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
    
    $logEntry = date('Y-m-d H:i:s') . " - User: $userName, Document: $documentId, Original File: " . $file['name'] . ", Saved As: $filename, Size: " . $file['size'] . " bytes, Path: $uploadPath\n";
    file_put_contents($userDir . '/upload_log.txt', $logEntry, FILE_APPEND | LOCK_EX);
    
    $userInfo = [
        'userName' => $userName,
        'created' => date('Y-m-d H:i:s'),
        'totalUploads' => 1,
        'lastUpload' => date('Y-m-d H:i:s')
    ];
    file_put_contents($userDir . '/user_info.json', json_encode($userInfo, JSON_PRETTY_PRINT));
    
    addUserAsTalent($userName);
    
    echo json_encode($response);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}

function addUserAsTalent($userName) {
    $talentsApiUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/../Onboarding/talents-api.php';
    
    if (empty($talentsApiUrl) || strpos($talentsApiUrl, 'http://') === false) {
        $talentsApiUrl = $_SERVER['DOCUMENT_ROOT'] . '/budakb%20copy/Onboarding/talents-api.php';
    }
    
    $talentData = [
        'userName' => $userName,
        'title' => 'New Hire',
        'mentor' => 'Unassigned',
        'progress' => 25 
    ];
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($talentData)
        ]
    ]);
    
    $response = @file_get_contents($talentsApiUrl, false, $context);
    
    if ($response === false) {
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $talentsApiUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($talentData));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Content-Length: ' . strlen(json_encode($talentData))
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($httpCode === 200) {
            } else {
                addTalentDirectly($userName, $talentData);
            }
        } else {
            addTalentDirectly($userName, $talentData);
        }
    } else {
    }
}

function addTalentDirectly($userName, $talentData) {
    $talentsFile = '../Uploads/talents.json';
    
    $uploadsDir = '../Uploads';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }
    
    $talents = [];
    if (file_exists($talentsFile)) {
        $existingData = file_get_contents($talentsFile);
        if ($existingData) {
            $talents = json_decode($existingData, true);
            if (!$talents) {
                $talents = [];
            }
        }
    }
    
    $talentExists = false;
    foreach ($talents as $talent) {
        if ($talent['userName'] === $userName) {
            $talentExists = true;
            break;
        }
    }
    
    if (!$talentExists) {
        $avatarId = rand(1, 70);
        $avatarUrl = "https://i.pravatar.cc/120?img=" . $avatarId;
        
        $newTalent = [
            'id' => uniqid(),
            'userName' => $userName,
            'title' => $talentData['title'],
            'mentor' => $talentData['mentor'],
            'progress' => $talentData['progress'],
            'avatarUrl' => $avatarUrl,
            'created' => date('Y-m-d H:i:s'),
            'stats' => [
                'tasks' => rand(1, 5),
                'messages' => rand(1, 5),
                'completion' => $talentData['progress']
            ],
            'feedback' => ''
        ];
        
        $talents[] = $newTalent;
        
        if (file_put_contents($talentsFile, json_encode($talents, JSON_PRETTY_PRINT))) {
        } else {
        }
    } else {
    }
}
?>
