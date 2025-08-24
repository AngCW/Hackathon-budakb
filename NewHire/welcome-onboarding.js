document.addEventListener('DOMContentLoaded', function() {
  const nameInput = document.querySelector('.name-input');
  const continueBtn = document.querySelector('.continue-btn');
  
  // Focus on input when page loads
  nameInput.focus();
  
  // Handle continue button click
  continueBtn.addEventListener('click', function() {
    const name = nameInput.value.trim();
    if (name) {
      // Store the name in localStorage
      localStorage.setItem('userName', name);
      
      // Navigate to document upload page
      window.location.href = 'document-upload.html';
    } else {
      nameInput.focus();
      nameInput.style.borderColor = '#ff4444';
      setTimeout(() => {
        nameInput.style.borderColor = '#e0e0e0';
      }, 2000);
    }
  });
  
  // Handle Enter key press
  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      continueBtn.click();
    }
  });
  
  // Clear border color on input
  nameInput.addEventListener('input', function() {
    this.style.borderColor = '#e0e0e0';
  });
});
