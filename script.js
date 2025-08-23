// For future interactivity (if needed later)
console.log("Talearn Landing Page Loaded");

// Video handling
document.addEventListener('DOMContentLoaded', function() {
  const video = document.getElementById('heroVideo');
  const videoLoading = document.getElementById('videoLoading');
  const videoError = document.getElementById('videoError');
  
  if (video) {
    // Video loading events
    video.addEventListener('loadstart', function() {
      console.log('Video loading started');
    });
    
    video.addEventListener('loadeddata', function() {
      console.log('Video data loaded');
      video.classList.add('loaded');
      videoLoading.style.display = 'none';
    });
    
    video.addEventListener('canplay', function() {
      console.log('Video can play');
      videoLoading.style.display = 'none';
    });
    
    video.addEventListener('error', function(e) {
      console.error('Video error:', e);
      videoLoading.style.display = 'none';
      videoError.style.display = 'block';
    });
    
    // Set a timeout to hide loading if video takes too long
    setTimeout(function() {
      if (videoLoading.style.display !== 'none') {
        videoLoading.style.display = 'none';
        if (!video.classList.contains('loaded')) {
          videoError.style.display = 'block';
        }
      }
    }, 10000); // 10 seconds timeout
  }
});

// Retry video function
function retryVideo() {
  const video = document.getElementById('heroVideo');
  const videoLoading = document.getElementById('videoLoading');
  const videoError = document.getElementById('videoError');
  
  if (video) {
    videoError.style.display = 'none';
    videoLoading.style.display = 'block';
    video.classList.remove('loaded');
    
    // Reload the video
    video.load();
    video.play().catch(function(error) {
      console.error('Video play failed:', error);
      videoLoading.style.display = 'none';
      videoError.style.display = 'block';
    });
  }
}
