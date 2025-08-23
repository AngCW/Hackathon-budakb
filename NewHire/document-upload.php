<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upload Documents - Talearn Onboarding</title>
  <link rel="stylesheet" href="document-upload.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="icon" href="../logo.png">
</head>
<body>
  <!-- Header -->
  <header class="topbar">
    <div class="topbar-left">
      <span class="logo">✿ talearn</span>
    </div>
  </header>

  <main class="upload-container">
    <!-- Progress Stepper -->
    <div class="progress-stepper">
      <div class="step active">
        <div class="step-circle">1</div>
        <div class="step-label">Upload documents</div>
      </div>
      <div class="step-line"></div>
      <div class="step">
        <div class="step-circle">2</div>
        <div class="step-label">Accounts & access</div>
      </div>
      <div class="step-line"></div>
      <div class="step">
        <div class="step-circle">3</div>
        <div class="step-label">IT setup</div>
      </div>
    </div>

    <!-- Upload Documents Section -->
    <div class="upload-section">
      <h1>Upload Documents</h1>
      
      <div class="documents-table">
        <div class="table-header">
          <div class="col-document">Document</div>
          <div class="col-required">Required</div>
          <div class="col-status">Status</div>
          <div class="col-action">Action</div>
        </div>
        
        <div class="table-row">
          <div class="col-document">Required Document #1</div>
          <div class="col-required">Yes</div>
          <div class="col-status pending" id="status-1">Pending</div>
          <div class="col-action">
            <button class="action-btn upload-btn" onclick="openUploadPopup(1)">Upload</button>
            <button class="action-btn replace-btn" onclick="openUploadPopup(1)" style="display: none;">Replace</button>
          </div>
        </div>
        
        <div class="table-row">
          <div class="col-document">Required Document #2</div>
          <div class="col-required">Yes</div>
          <div class="col-status pending" id="status-2">Pending</div>
          <div class="col-action">
            <button class="action-btn upload-btn" onclick="openUploadPopup(2)">Upload</button>
            <button class="action-btn replace-btn" onclick="openUploadPopup(2)" style="display: none;">Replace</button>
          </div>
        </div>
      </div>
      
      <button class="continue-btn" onclick="continueToNextStep()">Continue</button>
    </div>
  </main>

  <!-- Upload Popup Modal -->
  <div id="uploadModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Upload Document</h2>
        <span class="close" onclick="closeUploadPopup()">&times;</span>
      </div>
      <div class="modal-body">
        <form id="uploadForm" enctype="multipart/form-data">
          <div class="file-input-container">
            <input type="file" id="documentFile" name="document" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required>
            <label for="documentFile" class="file-label">
              <span class="file-icon">📁</span>
              <span class="file-text">Choose a file or drag it here</span>
            </label>
          </div>
          <div class="file-info" id="fileInfo" style="display: none;">
            <p>Selected file: <span id="fileName"></span></p>
            <p>Size: <span id="fileSize"></span></p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" onclick="closeUploadPopup()">Cancel</button>
            <button type="submit" class="btn-primary">Upload</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <script src="document-upload.js"></script>
</body>
</html>
