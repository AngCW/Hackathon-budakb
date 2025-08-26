let currentDocumentId = null;
let uploadedFiles = {};

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    document.getElementById('uploadForm').addEventListener('submit', handleFileUpload);
    
    document.getElementById('documentFile').addEventListener('change', handleFileSelect);
    
});

function initializePage() {
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
    
    const userName = localStorage.getItem('userName');
    if (!userName) {
        alert('User name not found. Please start from welcome-onboarding page.');
        return;
    }
    uploadFile(file, currentDocumentId, userName);
}

function uploadFile(file, documentId, userName) {
    const uploadBtn = document.querySelector('.btn-primary');
    const originalText = uploadBtn.textContent;
    uploadBtn.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentId', documentId);
    formData.append('userName', userName);
    
    fetch('upload-handler.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            uploadedFiles[documentId] = {
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString(),
                serverPath: data.uploadPath
            };
            
            updateDocumentStatus(documentId, 'uploaded');
            updateActionButtons(documentId, true);
            
            closeUploadPopup();
            showNotification('File uploaded successfully!', 'success');
            
        } else {
            showNotification('Upload failed: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        showNotification('Upload failed. Please try again.', 'error');
    })
    .finally(() => {
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
}

function continueToNextStep() {
    const allUploaded = Object.keys(uploadedFiles).length >= 2;
    
    if (!allUploaded) {
        showNotification('Please upload all required documents before continuing.', 'warning');
        return;
    }
    
    addUserAsTalent();
    
    showNotification('All documents uploaded! Proceeding to Accounts & Access...', 'success');
    const user = localStorage.getItem('userName') || '';
    const nextUrl = `AccountsAccess.html?user=${encodeURIComponent(user)}`;
    window.location.href = nextUrl;
}

async function addUserAsTalent() {
    const userName = localStorage.getItem('userName');
    if (!userName) {
        console.error('No user name found');
        return;
    }
    
    try {
        const response = await fetch('../Onboarding/talents-api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: userName,
                title: 'New Hire',
                mentor: 'Unassigned',
                progress: 50 
            })
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('User added as talent:', result.message);
        } else {
            console.error('Failed to add user as talent:', result.error);
        }
    } catch (error) {
        console.error('Error adding user as talent:', error);
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
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
    
    if (type === 'success') {
        notification.style.background = '#27ae60';
    } else if (type === 'warning') {
        notification.style.background = '#f39c12';
    } else if (type === 'error') {
        notification.style.background = '#e74c3c';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        closeUploadPopup();
    }
}

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
