<template>
  <div class="help-page">
    <h1 class="page-title">Help & Instructions</h1>
    
    <div class="content-wrapper">
      <div class="video-section">
        <h2>Tutorial Videos</h2>
        <div class="video-container">
          <iframe
            allow="fullscreen;"
            width="800"
            height="450"
            src="https://www.youtube.com/embed/JNQdYs9Tl5w"
            title="Tutorial Video 1"
          ></iframe>
        </div>
        <div class="video-container">
          <iframe
            allow="fullscreen;"
            width="800"
            height="450"
            src="https://youtube.com/embed/2eVGyL93Wmk"
            title="Tutorial Video 2"
          ></iframe>
        </div>
      </div>
      
      <div class="instructions-section">
        <h2>Publication Instructions</h2>
        <ol class="instructions-list">
          <li>
            Click the Download Button ("Random Civilizations" on homepage, or "Download Mod" after completing a draft) and extract the .zip file
          </li>
          <li>
            Log-in to ageofempires.com
          </li>
          <li>
            Go to Mods → Submit a Mod
          </li>
          <li>
            Fill out the form as you wish with the following specifications:
            <ul>
              <li>A) Game = Age of Empires II DE</li>
              <li>B) Type = Data Mod</li>
              <li>C) Tags = Data Mod</li>
              <li>D) Images = thumbnail.jpg found in extracted folder</li>
              <li>E) Zip File Upload = [id]-data.zip found in extracted folder</li>
              <li>F) Please credit me or the website!</li>
            </ul>
          </li>
          <li>
            Submit the data mod, and go to Mods → Submit a Mod again to publish the UI Mod
          </li>
          <li>
            Fill out the form as you wish with the following specifications:
            <ul>
              <li>A) Game = Age of Empires II DE</li>
              <li>B) Type = User Interface</li>
              <li>C) Tags = User Interface</li>
              <li>D) Images = thumbnail.jpg</li>
              <li>E) Zip File Upload = [id]-ui.zip found in extracted folder</li>
              <li>F) Please credit me or the website!</li>
            </ul>
          </li>
          <li>
            Click on the data mod → Subscribe → Enable in the mod manager at the main menu!
          </li>
        </ol>
        
        <div class="back-button-wrapper">
          <NuxtLink to="/" class="back-button">Back to Home</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Help page - no additional logic needed
</script>

<style scoped>
.help-page {
  padding: 2rem;
  padding-bottom: 4rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  color: hsl(52, 100%, 50%);
  text-align: center;
  margin-bottom: 2rem;
  text-shadow: 3px 3px 5px black;
  font-family: 'Cinzel', serif;
}

.content-wrapper {
  background: rgba(0, 0, 0, 0.8);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 8px;
  padding: 2rem;
}

.video-section {
  margin-bottom: 2rem;
}

.video-section h2,
.instructions-section h2 {
  color: hsl(52, 100%, 50%);
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
}

.video-container {
  margin-bottom: 1.5rem;
  text-align: center;
}

.video-container iframe {
  max-width: 100%;
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
}

.instructions-list {
  color: #ffffff;
  font-size: 1.1rem;
  line-height: 1.8;
  margin-left: 2rem;
}

.instructions-list li {
  margin-bottom: 1rem;
}

.instructions-list ul {
  margin-top: 0.5rem;
  margin-left: 2rem;
  list-style-type: disc;
}

.instructions-list ul li {
  margin-bottom: 0.5rem;
}

.back-button-wrapper {
  margin-top: 2rem;
  text-align: center;
}

.back-button {
  padding: 1rem 2rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.85), rgba(101, 67, 33, 0.85));
  color: hsl(52, 100%, 50%);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
  text-decoration: none;
  display: inline-block;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

@media (max-width: 1024px) {
  .video-container iframe {
    width: 100%;
    height: 300px;
  }
}

@media (max-width: 768px) {
  .help-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .instructions-list {
    font-size: 1rem;
    margin-left: 1rem;
  }
}
</style>
