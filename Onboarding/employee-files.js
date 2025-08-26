document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const employeeName = urlParams.get('user');
  
  if (employeeName) {
    document.getElementById('employeeName').textContent = `${employeeName}'s Files`;
    document.getElementById('employeeDetails').textContent = `Viewing uploaded documents for ${employeeName}`;
    loadEmployeeFiles(employeeName);
  } else {
    document.getElementById('employeeName').textContent = 'Employee Files';
    document.getElementById('employeeDetails').textContent = 'No employee specified';
    showNoFilesMessage();
  }
});

async function loadEmployeeFiles(employeeName) {
  try {
    const response = await fetch(`employee-files-api.php?user=${encodeURIComponent(employeeName)}`);
    const result = await response.json();
    
    if (result.success) {
      if (result.profile) {
        renderProfile(result.profile);
      }
      if (result.files) {
        displayFiles(result.files);
        updateFileCount(result.files.length);
      } else {
        updateFileCount(0);
      }
    } else {
      showNoFilesMessage();
    }
  } catch (error) {
    console.error('Error loading files:', error);
    showNoFilesMessage();
  }
}

function renderProfile(profile) {
  const block = document.getElementById('profileBlock');
  if (!block) return;
  block.style.display = 'block';
  const niceDate = formatNiceDate(profile.birthdate);
  const fields = [
    { label: 'First name', value: profile.firstName || '' },
    { label: 'Last name', value: profile.lastName || '' },
    { label: 'Gender', value: profile.gender || '' },
    { label: 'Birthdate', value: niceDate || '' },
  ];
  let html = '<div class="profile-grid">';
  fields.forEach(f => {
    html += `<div class="profile-item"><h4>${f.label}</h4><p>${escapeHtml(f.value)}</p></div>`;
  });
  html += '</div>';
  if (profile.bios) {
    html += `<div class="profile-item" style="margin-top:1rem"><h4>Bio</h4><p>${escapeHtml(profile.bios)}</p></div>`;
  }
  if (profile.feedback) {
    html += `<div class="profile-item" style="margin-top:1rem"><h4>Mentee Feedback</h4><p>${escapeHtml(profile.feedback)}</p></div>`;
  }
  block.innerHTML = html;
}

function formatNiceDate(isoLike) {
  if (!isoLike) return '';
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoLike)) {
    [y, m, d] = isoLike.split('-');
  } else if (/^[0-3]?\d-[0-1]?\d-\d{4}$/.test(isoLike)) {
    const parts = isoLike.split('-');
    d = parts[0].padStart(2, '0');
    m = parts[1].padStart(2, '0');
    y = parts[2];
  } else {
    return isoLike;
  }
  const day = parseInt(d, 10);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const suffix = (n)=>{const s=['th','st','nd','rd'], v=n%100; return s[(v-20)%10]||s[v]||s[0];};
  return `${day}${suffix(day)} ${monthNames[parseInt(m,10)-1]} ${y}`;
}

function escapeHtml(str) {
  try {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[s] || s));
  } catch (e) {
    console.error('escapeHtml error:', e);
    return String(str);
  }
}

function displayFiles(files) {
  const filesGrid = document.getElementById('filesGrid');
  const noFilesMessage = document.getElementById('noFilesMessage');
  
  if (noFilesMessage) {
    noFilesMessage.style.display = 'none';
  }
  
  filesGrid.innerHTML = '';
  
  files.forEach(file => {
    const fileCard = createFileCard(file);
    filesGrid.appendChild(fileCard);
  });
}

function createFileCard(file) {
  const card = document.createElement('div');
  card.className = 'file-card';
  
  const fileIcon = getFileIcon(file.name);
  const fileSize = formatFileSize(file.size);
  
  card.innerHTML = `
    <div class="file-icon">${fileIcon}</div>
    <div class="file-info">
      <h3>${file.name}</h3>
      <p>Size: ${fileSize} • Uploaded: ${file.uploadDate}</p>
    </div>
    <div class="file-actions">
      <button class="btn-view" onclick="viewFile('${file.path}', '${file.name}')">View</button>
      <button class="btn-download" onclick="downloadFile('${file.path}', '${file.name}')">Download</button>
    </div>
  `;
  
  return card;
}

function getFileIcon(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️';
    case 'txt':
      return '📃';
    default:
      return '📁';
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function viewFile(filePath, fileName) {
  alert(`Viewing ${fileName}\nPath: ${filePath}\n\nThis would open the file in a viewer in a real implementation.`);
}

function downloadFile(filePath, fileName) {
  const link = document.createElement('a');
  link.href = filePath;
  link.download = fileName;
  link.target = '_blank';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadAll() {
  alert('Download All functionality would create a ZIP file of all documents in a real implementation.');
}

function refreshFiles() {
  const urlParams = new URLSearchParams(window.location.search);
  const employeeName = urlParams.get('user');
  
  if (employeeName) {
    loadEmployeeFiles(employeeName);
  }
}

function showNoFilesMessage() {
  const filesGrid = document.getElementById('filesGrid');
  const noFilesMessage = document.getElementById('noFilesMessage');
  
  if (filesGrid) {
    filesGrid.innerHTML = '';
  }
  
  if (noFilesMessage) {
    noFilesMessage.style.display = 'flex';
  }
}

function updateFileCount(count) {
  const fileCountElement = document.getElementById('fileCount');
  if (fileCountElement) {
    fileCountElement.textContent = `${count} file${count !== 1 ? 's' : ''}`;
  }
}
