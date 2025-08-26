document.addEventListener('DOMContentLoaded', function() {
  const nameInput = document.querySelector('.name-input');
  const continueBtn = document.querySelector('.continue-btn');
  
  nameInput.focus();
  
  continueBtn.addEventListener('click', function() {
    const name = nameInput.value.trim();
    if (name) {
      localStorage.setItem('userName', name);
      
      window.location.href = 'document-upload.html';
    } else {
      nameInput.focus();
      nameInput.style.borderColor = '#ff4444';
      setTimeout(() => {
        nameInput.style.borderColor = '#e0e0e0';
      }, 2000);
    }
  });
  
  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      continueBtn.click();
    }
  });
  
  nameInput.addEventListener('input', function() {
    this.style.borderColor = '#e0e0e0';
  });
});
