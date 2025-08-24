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
    
    // Add user as talent to the onboarding system
    addUserAsTalent($userName);
    
    echo json_encode($response);
} else {
    // Upload failed
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}

/**
 * Add user as talent to the onboarding system
 */
function addUserAsTalent($userName) {
    // Use absolute path to ensure the API is found
    $talentsApiUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/../Onboarding/talents-api.php';
    
    // Alternative: Use server document root path
    if (empty($talentsApiUrl) || strpos($talentsApiUrl, 'http://') === false) {
        $talentsApiUrl = $_SERVER['DOCUMENT_ROOT'] . '/budakb%20copy/Onboarding/talents-api.php';
    }
    
    $talentData = [
        'userName' => $userName,
        'title' => 'New Hire',
        'mentor' => 'Unassigned',
        'progress' => 25 // Initial progress after document upload
    ];
    
    // Try using file_get_contents first (more reliable for local calls)
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => json_encode($talentData)
        ]
    ]);
    
    $response = @file_get_contents($talentsApiUrl, false, $context);
    
    if ($response === false) {
        // Fallback to cURL if file_get_contents fails
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
                error_log("User $userName added as talent successfully via cURL");
            } else {
                error_log("Failed to add user $userName as talent via cURL. HTTP Code: $httpCode, Response: $response");
                // Fallback to direct file system method
                addTalentDirectly($userName, $talentData);
            }
        } else {
            error_log("Failed to add user $userName as talent: cURL not available and file_get_contents failed");
            // Fallback to direct file system method
            addTalentDirectly($userName, $talentData);
        }
    } else {
        error_log("User $userName added as talent successfully via file_get_contents");
    }
}

/**
 * Add talent directly to the file system as a backup method
 */
function addTalentDirectly($userName, $talentData) {
    $talentsFile = '../Uploads/talents.json';
    
    // Create uploads directory if it doesn't exist
    $uploadsDir = '../Uploads';
    if (!is_dir($uploadsDir)) {
        mkdir($uploadsDir, 0755, true);
    }
    
    // Load existing talents
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
    
    // Check if talent already exists
    $talentExists = false;
    foreach ($talents as $talent) {
        if ($talent['userName'] === $userName) {
            $talentExists = true;
            break;
        }
    }
    
    if (!$talentExists) {
        // Generate random avatar image
        $avatarId = rand(1, 70);
        $avatarUrl = "https://i.pravatar.cc/120?img=" . $avatarId;
        
        // Create new talent
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
            'feedback' => 'Mentor is very helpful, I am looking forward to working with my teammates!'
        ];
        
        $talents[] = $newTalent;
        
        // Save to file
        if (file_put_contents($talentsFile, json_encode($talents, JSON_PRETTY_PRINT))) {
            error_log("User $userName added as talent successfully via direct file system method");
        } else {
            error_log("Failed to save talent data for user $userName via direct file system method");
        }
    } else {
        error_log("User $userName already exists as talent");
    }
}
?>
