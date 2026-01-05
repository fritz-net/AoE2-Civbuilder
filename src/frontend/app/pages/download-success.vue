<template>
  <div class="download-page">
    <div class="download-container">
      <div class="success-icon">✅</div>
      
      <h1 class="download-title">
        {{ autoInstalled ? 'Mod Installed Successfully!' : 'Mod Created Successfully!' }}
      </h1>
      
      <div class="download-info">
        <p class="download-message">
          <span v-if="autoInstalled">
            Your civilization mod has been automatically installed to your Age of Empires II mods folder.
          </span>
          <span v-else>
            Your civilization mod has been created and should download automatically.
          </span>
        </p>
        
        <div class="civ-details" v-if="civNames.length > 0">
          <h2>Included Civilizations:</h2>
          <ul class="civ-list">
            <li v-for="(name, index) in civNames" :key="index">
              {{ name }}
            </li>
          </ul>
        </div>
        
        <div class="file-info" v-if="filename">
          <p><strong>Filename:</strong> {{ filename }}</p>
        </div>
      </div>
      
      <div class="download-actions">
        <NuxtLink to="/build" class="action-button primary-btn">
          Create Another Civ
        </NuxtLink>
        
        <NuxtLink to="/combine" class="action-button secondary-btn">
          Combine More Civs
        </NuxtLink>
        
        <NuxtLink to="/" class="action-button tertiary-btn">
          Back to Home
        </NuxtLink>
      </div>
      
      <div class="help-section">
        <details>
          <summary>What to do next?</summary>
          <div class="help-content">
            <h3>Installing Your Mod</h3>
            <p>
              <strong>Option 1: Auto-Install (Recommended)</strong>
            </p>
            <p>
              When creating your mod, select "Auto-Install to Steam" for automatic installation:
            </p>
            <ol>
              <li>Click "Create Mod" and wait for it to be generated</li>
              <li>Select "Auto-Install to Steam" when prompted</li>
              <li>Choose your Age of Empires II directory (usually <code>C:\Users\[YourUsername]\Games\Age of Empires 2 DE</code>)</li>
              <li>If you have multiple Steam profiles, select the one you want to use</li>
              <li>The mod will be automatically extracted and installed!</li>
            </ol>
            <p>
              <strong>Note:</strong> Auto-install requires a Chromium-based browser (Chrome, Edge, Opera, etc.)
            </p>
            
            <p>
              <strong>Option 2: Manual Installation</strong>
            </p>
            <ol>
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
              <li>On game start, select the data mod to use</li>
            </ol>
            
            <h3>Need Help?</h3>
            <p>Visit the <NuxtLink to="/help">Help page</NuxtLink> for more information or join our <a href="https://discord.gg/vQxck6JDwf" target="_blank" rel="noopener">Discord community</a>.</p>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Get civNames, filename, and autoInstalled from query params
const civNames = computed(() => {
  const names = route.query.civs as string | undefined
  return names ? names.split(',') : []
})

const filename = computed(() => route.query.filename as string | undefined)
const autoInstalled = computed(() => route.query.autoInstalled === 'true')
</script>

<style scoped>
.download-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.download-container {
  max-width: 700px;
  width: 100%;
  background: rgba(139, 69, 19, 0.85);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.download-title {
  font-size: 2.5rem;
  color: hsl(52, 100%, 50%);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 2rem;
  font-family: 'Cinzel', serif;
}

.download-info {
  margin-bottom: 2rem;
  text-align: left;
}

.download-message {
  font-size: 1.2rem;
  color: hsla(52, 100%, 50%, 0.9);
  margin-bottom: 2rem;
  text-align: center;
}

.civ-details {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid hsla(52, 100%, 50%, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.civ-details h2 {
  color: hsl(52, 100%, 50%);
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.civ-list {
  list-style: none;
  padding: 0;
}

.civ-list li {
  color: hsla(52, 100%, 50%, 0.9);
  font-size: 1.1rem;
  padding: 0.5rem;
  border-bottom: 1px solid hsla(52, 100%, 50%, 0.2);
}

.civ-list li:last-child {
  border-bottom: none;
}

.file-info {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.file-info p {
  color: hsla(52, 100%, 50%, 0.9);
  margin: 0;
  word-break: break-all;
}

.download-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-button {
  padding: 1rem 2rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid hsl(52, 100%, 50%);
}

.primary-btn {
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.primary-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.secondary-btn {
  background: rgba(0, 0, 0, 0.4);
  color: hsl(52, 100%, 50%);
}

.secondary-btn:hover {
  background: rgba(139, 69, 19, 0.6);
  transform: translateY(-2px);
}

.tertiary-btn {
  background: rgba(0, 0, 0, 0.2);
  color: hsla(52, 100%, 50%, 0.8);
  border-color: hsla(52, 100%, 50%, 0.5);
}

.tertiary-btn:hover {
  background: rgba(0, 0, 0, 0.4);
  color: hsl(52, 100%, 50%);
  border-color: hsl(52, 100%, 50%);
}

.help-section {
  margin-top: 2rem;
  text-align: left;
}

details {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid hsla(52, 100%, 50%, 0.3);
  border-radius: 6px;
  padding: 1rem;
}

summary {
  color: hsl(52, 100%, 50%);
  font-size: 1.1rem;
  cursor: pointer;
  user-select: none;
  font-weight: bold;
}

summary:hover {
  color: hsl(52, 100%, 60%);
}

.help-content {
  margin-top: 1rem;
  color: hsla(52, 100%, 50%, 0.9);
  line-height: 1.6;
}

.help-content h3 {
  color: hsl(52, 100%, 50%);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.help-content ol, .help-content ul {
  margin-left: 1.5rem;
}

.help-content li {
  margin-bottom: 0.5rem;
}

.help-content code {
  background: rgba(0, 0, 0, 0.4);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: hsl(52, 100%, 60%);
  word-break: break-all;
}

.help-content a {
  color: hsl(52, 100%, 60%);
  text-decoration: underline;
}

.help-content a:hover {
  color: hsl(52, 100%, 70%);
}

@media (max-width: 768px) {
  .download-container {
    padding: 2rem 1.5rem;
  }

  .download-title {
    font-size: 1.8rem;
  }

  .success-icon {
    font-size: 3rem;
  }

  .download-actions {
    gap: 0.75rem;
  }

  .action-button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
