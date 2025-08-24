// Document Upload Page JavaScript
let currentDocumentId = null;
let uploadedFiles = {};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializePage();
    
    // Set up form submission
    document.getElementById('uploadForm').addEventListener('submit', handleFileUpload);
    
    // Set up file input change event
    document.getElementById('documentFile').addEventListener('change', handleFileSelect);
    
    // All documents start as pending by default
    // No pre-uploaded documents
});

function initializePage() {
    // Get user name from localStorage (set in welcome-onboarding page)
    const userName = localStorage.getItem('userName');
    if (userName) {
        console.log('Welcome, ' + userName + '!');
    } else {
        console.log('No user name found. Please start from welcome-onboarding page.');
    }
}

function openUploadPopup(documentId) {
    currentDocumentId = documentId;
    document.getElementById('uploadModal').style.display = 'block';
    
    // Reset form
    document.getElementById('uploadForm').reset();
    document.getElementById('fileInfo').style.display = 'none';
}

function closeUploadPopup() {
    document.getElementById('uploadModal').style.display = 'none';
    currentDocumentId = null;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.style.display = 'block';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('documentFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to upload.');
        return;
    }
    
    if (!currentDocumentId) {
        alert('Document ID not found.');
        return;
    }
    
    // Check if user name exists
    const userName = localStorage.getItem('userName');
    if (!userName) {
        alert('User name not found. Please start from welcome-onboarding page.');
        return;
    }
    
    // Upload file
    uploadFile(file, currentDocumentId, userName);
}

function uploadFile(file, documentId, userName) {
    // Show loading state
    const uploadBtn = document.querySelector('.btn-primary');
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentId', documentId);
    formData.append('userName', userName);
    
    // Send file to Node.js handler
    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // File uploaded successfully
            uploadedFiles[documentId] = {
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString(),
                serverPath: data.uploadPath
            };
            
            // Update UI
            updateDocumentStatus(documentId, 'uploaded');
            updateActionButtons(documentId, true);
            
            // Close modal
            closeUploadPopup();
            
            // Show success message
            showNotification('File uploaded successfully!', 'success');
            
            console.log('File uploaded to:', data.uploadPath);
            console.log('User folder created:', data.userName);
            
        } else {
            // Upload failed
            showNotification('Upload failed: ' + (data.error || 'Unknown error'), 'error');
            console.error('Upload error:', data.error);
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotification('Upload failed. Please try again.', 'error');
    })
    .finally(() => {
        // Reset button
        uploadBtn.textContent = originalText;
        uploadBtn.disabled = false;
    });
}

function updateDocumentStatus(documentId, status) {
    const statusElement = document.getElementById(`status-${documentId}`);
    if (statusElement) {
        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusElement.className = `col-status ${status}`;
    }
}

function updateActionButtons(documentId, isUploaded) {
    const row = document.querySelector(`[onclick="openUploadPopup(${documentId})"]`).closest('.table-row');
    const uploadBtn = row.querySelector('.upload-btn');
    const replaceBtn = row.querySelector('.replace-btn');
    
    if (isUploaded) {
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (replaceBtn) replaceBtn.style.display = 'inline-block';
    } else {
        if (uploadBtn) uploadBtn.style.display = 'inline-block';
        if (replaceBtn) replaceBtn.style.display = 'none';
    }
}

function createUserFolderAndSaveFile(file) {
    const userName = localStorage.getItem('userName') || 'default_user';
    
    
    console.log(`User: ${userName}`);
    console.log(`File: ${file.name} (${file.size} bytes)`);
    console.log(`Folder path: Uploads/${userName}/documents/`);
}

function continueToNextStep() {
    // Check if all required documents are uploaded
    const allUploaded = Object.keys(uploadedFiles).length >= 2;
    
    if (!allUploaded) {
        showNotification('Please upload all required documents before continuing.', 'warning');
        return;
    }
    
    // Show success message
    showNotification('All documents uploaded! Proceeding to next step...', 'success');
    
    // Simulate navigation delay
    setTimeout(() => {
        // Navigate to next step (Accounts & Access)
        // window.location.href = 'accounts-access.html';
        console.log('Navigating to next step: Accounts & Access');
    }, 2000);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    if (type === 'success') {
        notification.style.background = '#27ae60';
    } else if (type === 'warning') {
        notification.style.background = '#f39c12';
    } else if (type === 'error') {
        notification.style.background = '#e74c3c';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        closeUploadPopup();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
