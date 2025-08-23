// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize progress circles
  const progressCircles = document.querySelectorAll('.progress-circle');
  
  progressCircles.forEach(circle => {
    const percent = circle.getAttribute('data-percent');
    const path = circle.querySelector('.circle');
    
    // Set color based on percentage
    if (percent <= 20) {
      path.classList.add('secondary');
    } else {
      path.classList.add('primary');
    }
  });
  
  // Filter button functionality
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Here you would typically filter the task list
      // For this prototype, we'll just log the filter type
      console.log('Filter changed to:', this.textContent);
    });
  });
  
  // Task item click handler
  const taskItems = document.querySelectorAll('.task-item');
  
  taskItems.forEach(item => {
    item.addEventListener('click', function() {
      console.log('Task clicked:', this.querySelector('h4').textContent);
      // In a real application, this would navigate to task details
    });
  });
  
  console.log("Talearn Dashboard Loaded");
});