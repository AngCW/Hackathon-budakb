document.addEventListener('DOMContentLoaded', function() {

  const progressCircles = document.querySelectorAll('.progress-circle');
  
  progressCircles.forEach(circle => {
    const percent = circle.getAttribute('data-percent');
    const path = circle.querySelector('.circle');
    
    if (percent <= 20) {
      path.classList.add('secondary');
    } else {
      path.classList.add('primary');
    }
  });

  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      this.classList.add('active');
      
      console.log('Filter changed to:', this.textContent);
    });
  });
  
  const taskItems = document.querySelectorAll('.task-item');
  
  taskItems.forEach(item => {
    item.addEventListener('click', function() {
      console.log('Task clicked:', this.querySelector('h4').textContent);
    });
  });
  
  console.log("Talearn Dashboard Loaded");
});