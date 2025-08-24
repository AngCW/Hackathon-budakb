document.addEventListener('DOMContentLoaded', () => {
  // Load talents from API
  loadTalents();
  
  // Set up search functionality
  setupSearch();
  
  // Set up auto-refresh every 10 seconds
  setInterval(loadTalents, 10000);
});

/**
 * Load talents from the API and display them
 */
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

/**
 * Display talents as cards
 */
function displayTalents(talents) {
  const container = document.getElementById('talentCardsContainer');
  const noTalentsMessage = document.getElementById('noTalentsMessage');
  
  // Hide no talents message
  if (noTalentsMessage) {
    noTalentsMessage.style.display = 'none';
  }
  
  // Clear container and add talent cards
  container.innerHTML = '';
  
  talents.forEach((talent, index) => {
    const talentCard = createTalentCard(talent, index);
    container.appendChild(talentCard);
  });
  
  // Initialize progress rings after cards are added
  initializeProgressRings();
}

/**
 * Create a talent card element
 */
function createTalentCard(talent, index) {
  const card = document.createElement('article');
  card.className = 'talent-card';
  card.setAttribute('data-talent-id', talent.id);
  
  // Add gradient classes for some cards
  if (index === 4) {
    card.classList.add('gradient-violet');
  } else if (index === 5) {
    card.classList.add('gradient-pink');
  }
  
  // Determine if this is the first card (special case)
  const isFirstCard = index === 0;
  
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
    ${isFirstCard ? 
      '<div class="actions"><button class="btn tiny">Give Feedback</button><button class="btn tiny light">Mentee Feedback</button></div>' :
      `<div class="feedback-chip">Mentee feedback: ${talent.feedback}</div>`
    }
    <div class="card-actions">
      <button class="btn-remove" onclick="removeTalent('${talent.id}', '${talent.userName}')" title="Remove Talent">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  
  return card;
}

/**
 * Show no talents message
 */
function showNoTalentsMessage() {
  const container = document.getElementById('talentCardsContainer');
  const noTalentsMessage = document.getElementById('noTalentsMessage');
  
  if (noTalentsMessage) {
    noTalentsMessage.style.display = 'flex';
  }
}

/**
 * Initialize progress rings with CSS custom properties
 */
function initializeProgressRings() {
  document.querySelectorAll('.progress-ring').forEach(el => {
    const pct = Number(el.getAttribute('data-percent')) || 0;
    el.style.setProperty('--pct', pct);
  });
}

/**
 * Set up search functionality
 */
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

/**
 * Handle search input
 */
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase().trim();
  
  if (searchTerm === '') {
    // Show all talents if search is empty
    loadTalents();
    return;
  }
  
  // Filter talents based on search term
  filterTalents(searchTerm);
}

/**
 * Filter talents based on search term
 */
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
    console.error('Error filtering talents:', error);
  }
}

/**
 * Show no search results message
 */
function showNoSearchResults(searchTerm) {
  const container = document.getElementById('talentCardsContainer');
  container.innerHTML = `
    <div class="no-talents-message">
      <div class="no-talents-content">
        <div class="no-talents-icon">🔍</div>
        <h3>No Results Found</h3>
        <p>No talents found matching "${searchTerm}". Try a different search term.</p>
        <button class="btn-primary" onclick="loadTalents()">Show All Talents</button>
      </div>
    </div>
  `;
}

/**
 * Handle filter button click
 */
function handleFilter() {
  // This could be expanded to show filter options
  console.log('Filter button clicked');
  // For now, just reload all talents
  loadTalents();
}

/**
 * Remove a talent from the system
 */
async function removeTalent(talentId, userName) {
  if (!confirm(`Are you sure you want to remove ${userName} from the talents list?`)) {
    return;
  }
  
  try {
    const response = await fetch('talents-api.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: talentId,
        userName: userName
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Remove the card from the UI
      const card = document.querySelector(`[data-talent-id="${talentId}"]`);
      if (card) {
        card.remove();
      }
      
      // Reload talents to refresh the display
      loadTalents();
      
      // Show success message
      showNotification(`${userName} has been removed from the talents list.`, 'success');
    } else {
      showNotification(`Failed to remove talent: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error removing talent:', error);
    showNotification('Failed to remove talent. Please try again.', 'error');
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