<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

error_reporting(E_ALL);
ini_set('display_errors', 1);



$talentsFile = __DIR__ . '/../Uploads/talents.json';

$uploadsDir = __DIR__ . '/../Uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

if (!file_exists($talentsFile)) {
    file_put_contents($talentsFile, json_encode([], JSON_PRETTY_PRINT));
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['action']) && strtolower($_GET['action']) === 'delete' && isset($_GET['id']) && isset($_GET['userName'])) {
            removeTalent();
        } else {
            getTalents();
        }
        break;
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['action']) && strtolower($input['action']) === 'delete') {
            removeTalent();
        } else {
            addTalent();
        }
        break;
    case 'DELETE':
        removeTalent();
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

function getTalents() {
    global $talentsFile;
    
    if (!file_exists($talentsFile)) {
        echo json_encode([]);
        return;
    }
    
    $talents = json_decode(file_get_contents($talentsFile), true);
    if (!$talents) {
        $talents = [];
    }
    
    echo json_encode($talents);
}

function addTalent() {
    global $talentsFile;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['userName'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $userName = $input['userName'];
    $title = $input['title'] ?? 'New Hire';
    $mentor = $input['mentor'] ?? 'Unassigned';
    $progress = $input['progress'] ?? 0;
    
    $talents = [];
    if (file_exists($talentsFile)) {
        $talents = json_decode(file_get_contents($talentsFile), true);
        if (!$talents) {
            $talents = [];
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
            'title' => $title,
            'mentor' => $mentor,
            'progress' => $progress,
            'avatarUrl' => $avatarUrl,
            'created' => date('Y-m-d H:i:s'),
            'stats' => [
                'tasks' => rand(1, 5),
                'messages' => rand(1, 5),
                'completion' => $progress
            ],
            'feedback' => ''
        ];
        
        $talents[] = $newTalent;
        
        if (file_put_contents($talentsFile, json_encode($talents, JSON_PRETTY_PRINT))) {
            error_log("Talent added successfully: $userName");
            echo json_encode([
                'success' => true,
                'message' => 'Talent added successfully',
                'talent' => $newTalent
            ]);
        } else {
            error_log("Failed to save talent data for: $userName");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save talent data']);
        }
    } else {
        error_log("Talent already exists: $userName");
        echo json_encode([
            'success' => true,
            'message' => 'Talent already exists',
            'talent' => $talents[array_search($userName, array_column($talents, 'userName'))]
        ]);
    }
}

function removeTalent() {
    global $talentsFile;
    
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!$input && !empty($_POST)) {
        $input = $_POST;
    }
    if (!$input && !empty($_GET) && isset($_GET['action']) && strtolower($_GET['action']) === 'delete') {
        $input = $_GET;
    }
    
    error_log("Removing talent with data: " . json_encode($input));
    
    if (!$input || !isset($input['id']) || !isset($input['userName'])) {
        error_log("Missing required fields for talent removal");
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: id and userName']);
        return;
    }
    
    $talentId = $input['id'];
    $userName = $input['userName'];
    
    $talents = [];
    if (file_exists($talentsFile)) {
        $talents = json_decode(file_get_contents($talentsFile), true);
        if (!$talents) {
            $talents = [];
        }
    }
    
    $talentFound = false;
    foreach ($talents as $key => $talent) {
        if ($talent['id'] === $talentId && $talent['userName'] === $userName) {
            unset($talents[$key]);
            $talentFound = true;
            break;
        }
    }
    
    if ($talentFound) {
        $userFolderDeleted = deleteUserFolder($userName);
        
        $talents = array_values($talents);
        
        if (file_put_contents($talentsFile, json_encode($talents, JSON_PRETTY_PRINT))) {
            $message = "Talent removed successfully: $userName (ID: $talentId)";
            if ($userFolderDeleted) {
                $message .= " - User folder deleted";
            } else {
                $message .= " - User folder deletion failed";
            }
            
            error_log($message);
            echo json_encode([
                'success' => true,
                'message' => 'Talent removed successfully',
                'removedTalent' => $userName,
                'userFolderDeleted' => $userFolderDeleted
            ]);
        } else {
            error_log("Failed to save updated talents file after removal");
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save updated talents file']);
        }
    } else {
        error_log("Talent not found for removal: $userName (ID: $talentId)");
        http_response_code(404);
        echo json_encode(['error' => 'Talent not found']);
    }
}

function deleteUserFolder($userName) {
    $uploadsDir = __DIR__ . '/../Uploads';
    $userDir = $uploadsDir . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $userName);
    
    if (!is_dir($userDir)) {
        error_log("User directory does not exist: $userDir");
        return true; 
    }
    
    try {
        $deleted = deleteDirectoryRecursive($userDir);
        
        if ($deleted) {
            error_log("User folder deleted successfully: $userDir");
            return true;
        } else {
            error_log("Failed to delete user folder: $userDir");
            return false;
        }
    } catch (Exception $e) {
        error_log("Error deleting user folder: " . $e->getMessage());
        return false;
    }
}

function deleteDirectoryRecursive($dir) {
    if (!is_dir($dir)) {
        return false;
    }
    
    $files = array_diff(scandir($dir), array('.', '..'));
    
    foreach ($files as $file) {
        $path = $dir . DIRECTORY_SEPARATOR . $file;
        
        if (is_dir($path)) {
            deleteDirectoryRecursive($path);
        } else {
            if (!unlink($path)) {
                error_log("Failed to delete file: $path");
                return false;
            }
        }
    }
    
    if (!rmdir($dir)) {
        error_log("Failed to delete directory: $dir");
        return false;
    }
    
    return true;
}
?>
