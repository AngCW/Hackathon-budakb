<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talearn Onboarding</title>
  <link rel="stylesheet" href="onboarding.css">
</head>
<body>
  <div class="onboarding-container">
    <div class="onboarding-card">
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      
      <div class="onboarding-content">
        <h1>Welcome to your onboarding journey</h1>
        <p>What should we call you?</p>
        
        <form id="name-form">
          <div class="input-group">
            <input type="text" id="user-name" placeholder="Enter your name" required>
          </div>
          <button type="submit" class="continue-btn">Continue</button>
        </form>
      </div>
      
      <div class="onboarding-footer">
        <span class="logo">✿ talearn</span>
      </div>
    </div>
  </div>

  <script src="onboarding.js"></script>
</body>
</html>