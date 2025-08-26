document.addEventListener('DOMContentLoaded', function() {
  const video = document.getElementById('heroVideo');
  const videoLoading = document.getElementById('videoLoading');
  const videoError = document.getElementById('videoError');
  
  if (video) {
    video.addEventListener('loadstart', function() {
    });
    
    video.addEventListener('loadeddata', function() {
      video.classList.add('loaded');
      videoLoading.style.display = 'none';
    });
    
    video.addEventListener('canplay', function() {
      videoLoading.style.display = 'none';
    });
    
    video.addEventListener('error', function(e) {
      videoLoading.style.display = 'none';
      videoError.style.display = 'block';
    });
    
    setTimeout(function() {
      if (videoLoading.style.display !== 'none') {
        videoLoading.style.display = 'none';
        if (!video.classList.contains('loaded')) {
          videoError.style.display = 'block';
        }
      }
    }, 10000);
  }
});

function retryVideo() {
  const video = document.getElementById('heroVideo');
  const videoLoading = document.getElementById('videoLoading');
  const videoError = document.getElementById('videoError');
  
  if (video) {
    videoError.style.display = 'none';
    videoLoading.style.display = 'block';
    video.classList.remove('loaded');
    
    video.load();
    video.play().catch(function(error) {
      videoLoading.style.display = 'none';
      videoError.style.display = 'block';
    });
  }
}
