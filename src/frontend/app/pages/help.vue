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

      <!-- Single Player Instructions -->
      <div class="instructions-section faq-section">
        <h2>Single Player / Local Mod Installation</h2>
        <ol class="instructions-list">
          <li>Locate the downloaded .zip file</li>
          <li>Extract the contents to your Age of Empires II mods folder:
            <ul>
              <li><strong>Steam:</strong> <code>C:\Users\[YourUsername]\Games\Age of Empires 2 DE\[YourID]\mods\local</code></li>
              <li>Both Zips (<code>*-data.zip</code>, <code>*-ui.zip</code>) should then also be extracted so you end up with:
                <ul>
                  <li><code>[ModName]-data</code> folder</li>
                  <li><code>[ModName]-ui</code> folder</li>
                </ul>
              </li>
            </ul>
          </li>
          <li>Launch Age of Empires II: Definitive Edition</li>
          <li>Your mod is enabled by default</li>
          <li>Make sure only one custom civ UI mod is enabled at a time</li>
          <li>Before starting a match, make sure to select your data mod under game settings</li>
        </ol>
      </div>
      
      <!-- Vanilla Civs FAQ -->
      <div class="instructions-section faq-section">
        <h2>Using Vanilla Civilizations</h2>
        <div class="faq-content">
          <p>
            If you want to battle against vanilla civilizations or mix them with your custom civs, 
            download all vanilla civilization JSON files here:
          </p>
          <div class="download-button-wrapper">
            <button class="download-vanilla-btn" @click="handleDownloadVanilla">
              ⬇️ Download Vanilla Civs
            </button>
          </div>
          <p>
            <strong>Best practices for combining vanilla and custom civilizations:</strong>
          </p>
          <ul class="faq-list">
            <li>
              <strong>Rename civs in game order:</strong> Use a numbering pattern like <code>01_Aztecs.json</code>, 
              <code>02_Britons.json</code>, etc. This helps maintain the order in which civilizations appear in the game.
            </li>
            <li>
              <strong>Replace civs you don't want:</strong> You can replace any vanilla civilization with your custom one. 
              Just use the corresponding number (e.g., replace <code>01_Aztecs.json</code> with your custom civ and rename it accordingly).
            </li>
            <li>
              <strong>Limit to 50 civilizations:</strong> Age of Empires II currently does not support more than 50 civilizations 
              in a single mod. Make sure your total number of civilizations (vanilla + custom) does not exceed this limit to ensure compatibility.
            </li>
          </ul>
          <p class="faq-note">
            💡 <strong>Tip:</strong> Start by downloading the vanilla civs, then select which ones you want to keep and 
            add your custom civilizations to fill out your mod to the maximum of 50 civs.
          </p>
        </div>
      </div>
      
      <div class="instructions-section faq-section">
        <h2>Publication Instructions (only needed for multiplayer!)</h2>
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
function handleDownloadVanilla() {
  // Create a form and submit it to download the vanilla civs zip
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = '/vanilla'
  form.style.display = 'none'
  document.body.appendChild(form)
  try {
    form.submit()
  } finally {
    // Clean up the form element
    document.body.removeChild(form)
  }
}
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

.faq-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid hsla(52, 100%, 50%, 0.3);
}

.faq-content {
  color: #ffffff;
  font-size: 1.1rem;
  line-height: 1.8;
}

.faq-content p {
  margin-bottom: 1rem;
}

.faq-list {
  margin-left: 2rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  list-style-type: disc;
}

.faq-list li {
  margin-bottom: 1rem;
}

.faq-note {
  padding: 1rem;
  background: rgba(139, 69, 19, 0.3);
  border-left: 4px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  margin-top: 1.5rem;
}

.download-button-wrapper {
  text-align: center;
  margin: 1.5rem 0;
}

.download-vanilla-btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: linear-gradient(to bottom, rgba(30, 80, 120, 0.9), rgba(20, 60, 90, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.download-vanilla-btn:hover {
  background: linear-gradient(to bottom, rgba(40, 100, 140, 0.95), rgba(30, 80, 120, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.inline-link {
  color: hsl(52, 100%, 60%);
  text-decoration: none;
  transition: color 0.2s ease;
  font-weight: bold;
}

.inline-link:hover {
  color: hsl(52, 100%, 70%);
  text-decoration: underline;
}

code {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: hsl(52, 100%, 60%);
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
