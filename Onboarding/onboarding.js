document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('name-form');
  const userNameInput = document.getElementById('user-name');
  const progressFill = document.querySelector('.progress-fill');
  
  // Update progress bar to initial state
  progressFill.style.width = '0%';
  
  // Focus on input field when page loads
  userNameInput.focus();
  
  // Form submission handler
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userName = userNameInput.value.trim();
    
    if (userName) {
      // Store the name for use in the next steps
      sessionStorage.setItem('onboardingUserName', userName);
      
      // Simulate progress before moving to next step
      progressFill.style.width = '100%';
      
      // In a real application, this would navigate to the next onboarding step
      setTimeout(() => {
        alert(`Welcome, ${userName}! This would proceed to the next onboarding step.`);
        // window.location.href = 'next-onboarding-step.php';
      }, 500);
    }
  });
  
  console.log("Talearn Onboarding Page Loaded");
});