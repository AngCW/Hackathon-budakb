document.addEventListener('DOMContentLoaded', () => {
  loadTalents();
  
  setupSearch();
  setupAddManager();
  
  setInterval(loadTalents, 10000);
});

async function loadTalents() {
  try {
    const response = await fetch('talents-api.php');
    const talents = await response.json();
    
    if (talents && talents.length > 0) {
      displayTalents(talents);
    } else {
      showNoTalentsMessage();
    }
  } catch (error) {
    console.error('Error loading talents:', error);
    showNoTalentsMessage();
  }
}

function displayTalents(talents) {
  const container = document.getElementById('talentCardsContainer');
  const noTalentsMessage = document.getElementById('noTalentsMessage');
  
  if (noTalentsMessage) {
    noTalentsMessage.style.display = 'none';
  }
  
  container.innerHTML = '';
  
  talents.forEach((talent, index) => {
    const talentCard = createTalentCard(talent, index);
    container.appendChild(talentCard);
  });
  
  initializeProgressRings();
}

function createTalentCard(talent, index) {
  const card = document.createElement('article');
  card.className = 'talent-card';
  card.setAttribute('data-talent-id', talent.id);
  
  if (index === 4) {
    card.classList.add('gradient-violet');
  } else if (index === 5) {
    card.classList.add('gradient-pink');
  }
  
  card.innerHTML = `
    <div class="mentor">${talent.mentor}</div>
    <div class="avatar-block">
      <div class="progress-ring" data-percent="${talent.progress}">
        <div class="ring"><img src="${talent.avatarUrl}" alt="${talent.userName}"></div>
      </div>
    </div>
    <div class="person">
      <div class="name">${talent.userName}</div>
      <div class="title">${talent.title}</div>
    </div>
    <div class="stats">
      <span>${talent.stats.tasks}</span>
      <span>${talent.stats.messages}</span>
      <span>${talent.stats.completion}%</span>
    </div>
    <div class="actions"><button class="btn tiny">Give Feedback</button></div>
    <div class="actions-row">
      <button class="btn small" onclick="showUploadedFiles('${talent.userName}')">Show Uploaded Files</button>
      <button class="btn small light" onclick="markITPrepared('${talent.userName}')">IT Device Prepared</button>
    </div>
    ${talent.feedback ? `<div class=\"feedback-chip\">Mentee feedback: ${escapeHtml(String(talent.feedback))}</div>` : ''}
    <div class="card-actions">
      <button class="btn-delete" onclick="removeTalent('${talent.id}', '${talent.userName}')" title="Remove Employee">Delete</button>
    </div>
  `;
  
  return card;
}

function showNoTalentsMessage() {
  const container = document.getElementById('talentCardsContainer');
  const noTalentsMessage = document.getElementById('noTalentsMessage');
  
  if (noTalentsMessage) {
    noTalentsMessage.style.display = 'flex';
  }
}

function initializeProgressRings() {
  document.querySelectorAll('.progress-ring').forEach(el => {
    const pct = Number(el.getAttribute('data-percent')) || 0;
    el.style.setProperty('--pct', pct);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s] || s));
}

function showUploadedFiles(userName) {
  window.location.href = `employee-files.html?user=${encodeURIComponent(userName)}`;
}

function markITPrepared(userName) {
  const ticket = Math.floor(10000 + Math.random() * 90000);
  fetch('../NewHire/it-status-api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, prepared: true, ticket })
  }).catch(()=>{});
  showNotification(`IT device prepared for ${userName}. Ticket #${ticket}`, 'success');
}

function setupSearch() {
  const searchInput = document.querySelector('.searchbar input');
  const filterBtn = document.querySelector('.filter');
  
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
  
  if (filterBtn) {
    filterBtn.addEventListener('click', handleFilter);
  }
}

function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase().trim();
  
  if (searchTerm === '') {
    loadTalents();
    return;
  }
  
  filterTalents(searchTerm);
}

async function filterTalents(searchTerm) {
  try {
    const response = await fetch('talents-api.php');
    const allTalents = await response.json();
    
    if (!allTalents) return;
    
    const filteredTalents = allTalents.filter(talent => 
      talent.userName.toLowerCase().includes(searchTerm) ||
      talent.mentor.toLowerCase().includes(searchTerm) ||
      talent.title.toLowerCase().includes(searchTerm)
    );
    
    if (filteredTalents.length > 0) {
      displayTalents(filteredTalents);
    } else {
      showNoSearchResults(searchTerm);
    }
  } catch (error) {
  }
}

function showNoSearchResults(searchTerm) {
  const container = document.getElementById('talentCardsContainer');
  container.innerHTML = `
    <div class="no-talents-message">
      <div class="no-talents-content">
        <div class="no-talents-icon">🔍</div>
        <h3>No Results Found</h3>
        <p>No employees found matching "${searchTerm}". Try a different search term.</p>
        <button class="btn-primary" onclick="loadTalents()">Show All Employees</button>
      </div>
    </div>
  `;
}

function handleFilter() {
  console.log('Filter button clicked');
  loadTalents();
}

function setupAddManager() {
  const openBtn = document.getElementById('addManagerBtn');
  const modal = document.getElementById('addManagerModal');
  const closeBtn = document.getElementById('closeAddManager');
  const cancelBtn = document.getElementById('cancelAddManager');
  const form = document.getElementById('addManagerForm');

  function open() { modal.setAttribute('aria-hidden', 'false'); }
  function close() { modal.setAttribute('aria-hidden', 'true'); form.reset(); }

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const name = (formData.get('name') || '').toString().trim();
      const age = Number(formData.get('age'));
      const gender = (formData.get('gender') || '').toString();
      const department = (formData.get('department') || '').toString().trim();
      if (!name || !age || !gender || !department) return;

      // Reuse talents API to create a manager-like card
      const payload = {
        userName: name,
        title: `${department} Manager` ,
        mentor: gender,
        progress: 0
      };

      try {
        const res = await fetch('talents-api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && (data.success || data.talent)) {
          // Also persist manager in managers.json for Inbox
          try {
            await fetch('managers-api.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, role: `${department} Manager` })
            });
          } catch (e) {
            console.warn('Failed to save manager to managers.json', e);
          }
          close();
          showNotification(`Manager ${name} added`, 'success');
          loadTalents();
        } else {
          showNotification('Failed to add manager', 'error');
        }
      } catch(err) {
        console.error(err);
        showNotification('Failed to add manager', 'error');
      }
    });
  }
}

async function removeTalent(talentId, userName) {
  if (!confirm(`Are you sure you want to remove ${userName} from the employees list?`)) {
    return;
  }
  
  try {
    let response;
    const query = new URLSearchParams({ action: 'delete', id: talentId, userName, _: Date.now().toString() }).toString();
    response = await fetch(`talents-api.php?${query}`, { method: 'GET', cache: 'no-store', headers: { 'Cache-Control': 'no-store' } });
    if (!response || !response.ok) {
      response = await fetch('talents-api.php', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: talentId, userName, _: Date.now() })
      });
    }
    if (!response || !response.ok) {
      response = await fetch('talents-api.php', {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: talentId, userName, _: Date.now() })
      });
    }
    
    let result;
    try {
      result = await response.json();
    } catch (e) {
      result = { success: false, error: `Invalid server response (status ${response ? response.status : 'N/A'})` };
    }
    console.log('Delete response status:', response && response.status, 'result:', result);
    
    if (result.success) {
      const card = document.querySelector(`[data-talent-id="${talentId}"]`);
      if (card) {
        card.remove();
      }
      
      // Reload talents to refresh the display
      loadTalents();
      
      // Show success message with folder deletion status
      let message = `${userName} has been removed from the employees list.`;
    
      
      showNotification(message, 'success');

      // Also remove from managers.json if present
      try {
        await fetch('managers-api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', name: userName })
        });
      } catch (e) {
        console.warn('Failed to remove from managers.json', e);
      }
    } else {
      const statusText = response ? ` (status ${response.status})` : '';
      showNotification(`Failed to remove employee: ${result.error || 'Unknown error'}${statusText}`, 'error');
    }
  } catch (error) {
    console.error('Error removing employee:', error);
    showNotification(`Failed to remove employee. ${error && error.message ? error.message : 'Please try again.'}`, 'error');
  }
}

/**
 * Show notification message
 */
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