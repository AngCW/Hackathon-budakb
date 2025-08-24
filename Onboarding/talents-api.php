<?php
// Talents API for Onboarding Page
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Log all requests for debugging
error_log("Talents API called: " . $_SERVER['REQUEST_METHOD'] . " - " . date('Y-m-d H:i:s'));

// Define the talents data file
$talentsFile = '../Uploads/talents.json';

// Create uploads directory if it doesn't exist
$uploadsDir = '../Uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Initialize talents file if it doesn't exist
if (!file_exists($talentsFile)) {
    file_put_contents($talentsFile, json_encode([], JSON_PRETTY_PRINT));
}

// Handle different HTTP methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getTalents();
        break;
    case 'POST':
        addTalent();
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
    
    error_log("Getting talents from: $talentsFile");
    
    if (!file_exists($talentsFile)) {
        error_log("Talents file does not exist, returning empty array");
        echo json_encode([]);
        return;
    }
    
    $talents = json_decode(file_get_contents($talentsFile), true);
    if (!$talents) {
        $talents = [];
    }
    
    error_log("Returning " . count($talents) . " talents");
    echo json_encode($talents);
}

function addTalent() {
    global $talentsFile;
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log("Adding talent with data: " . json_encode($input));
    
    if (!$input || !isset($input['userName'])) {
        error_log("Missing required fields for talent");
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    $userName = $input['userName'];
    $title = $input['title'] ?? 'New Hire';
    $mentor = $input['mentor'] ?? 'Unassigned';
    $progress = $input['progress'] ?? 0;
    
    // Load existing talents
    $talents = [];
    if (file_exists($talentsFile)) {
        $talents = json_decode(file_get_contents($talentsFile), true);
        if (!$talents) {
            $talents = [];
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
            'feedback' => 'Mentor is very helpful, I am looking forward to working with my teammates!'
        ];
        
        $talents[] = $newTalent;
        
        // Save to file
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
    
    // Get DELETE data
    $input = json_decode(file_get_contents('php://input'), true);
    
    error_log("Removing talent with data: " . json_encode($input));
    
    if (!$input || !isset($input['id']) || !isset($input['userName'])) {
        error_log("Missing required fields for talent removal");
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: id and userName']);
        return;
    }
    
    $talentId = $input['id'];
    $userName = $input['userName'];
    
    // Load existing talents
    $talents = [];
    if (file_exists($talentsFile)) {
        $talents = json_decode(file_get_contents($talentsFile), true);
        if (!$talents) {
            $talents = [];
        }
    }
    
    // Find and remove the talent
    $talentFound = false;
    foreach ($talents as $key => $talent) {
        if ($talent['id'] === $talentId && $talent['userName'] === $userName) {
            unset($talents[$key]);
            $talentFound = true;
            break;
        }
    }
    
    if ($talentFound) {
        // Reindex array after removal
        $talents = array_values($talents);
        
        // Save updated talents to file
        if (file_put_contents($talentsFile, json_encode($talents, JSON_PRETTY_PRINT))) {
            error_log("Talent removed successfully: $userName (ID: $talentId)");
            echo json_encode([
                'success' => true,
                'message' => 'Talent removed successfully',
                'removedTalent' => $userName
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
?>
