<template>
  <div class="about-page">
    <h1 class="page-title">About</h1>
    
    <div class="content-wrapper">
      <div class="about-content">
        <section class="intro-section">
          <p>
            This is an easy-to-use tool for creating civilizations for Age of Empires II: Definitive Edition. Although more complex mods can be made with the Advanced Genie Editor, it takes time to learn and does not have any multiplayer capabilities!
          </p>
        </section>
        
        <section class="features-section">
          <h2>Three Main Options</h2>
          
          <div class="feature-block">
            <h3>Randomized Civilizations</h3>
            <p>
              Scramble the bonuses, tech trees, unique units, and much more for all factions at the click of a button. Each click will download a .zip file which contains two mod .zip files inside: one for the data mod and one for the UI mod.
            </p>
            <p>
              You can extract these and put them in your local mods folder, or publish them on the Mod Workshop by following the instructions given in the "Help" page. Please credit this website in the description of your mod so that others can enjoy this site too!
            </p>
          </div>
          
          <div class="feature-block">
            <h3>Civilization Building</h3>
            <p>
              For a singleplayer experience (or maximum combo-power), you can create your own civilizations with any of the bonuses, techs, etc. in the base game or created by me. If you want to create your own bonuses, you'll have to learn how to use the Advanced Genie Editor (or send me a suggestion on Discord at Krakenmeister#1672, and I might add it!).
            </p>
            <p>
              Once you build a civilization, you can download the preset as a .json file. You can view civilizations from their .json preset file, as well as combine multiple presets into a single mod containing those civilizations. After combining, the mod can be downloaded and published just like the randomized civilizations.
            </p>
            <p class="note">
              <strong>Note:</strong> There are a few techs and bonuses that, if shared among multiple civilizations while combining, cause compatibility issues. UI mod issues are extremely minor and have no effect on gameplay, but data mod issues are critical and are not available to download.
            </p>
          </div>
          
          <div class="feature-block">
            <h3>Civilization Drafting</h3>
            <p>
              If you want to play a game with friends, one player has to create the draft. 250 tech tree points is recommended to force players to choose somewhat between strategies, but most people prefer the full 500 point trees or even the ultra-low 100 point trees for an extra challenge!
            </p>
          </div>
        </section>
        
        <div class="credit-section">
          <h2>Credits</h2>
          <p>Created by <strong>Krakenmeister</strong></p>
          <p>Join the community on <a href="https://discord.gg/vQxck6JDwf" target="_blank" rel="noopener noreferrer">Discord</a></p>
          <p>Support the project on <a href="https://www.buymeacoffee.com/krakenmeister" target="_blank" rel="noopener noreferrer">Buy Me a Coffee</a></p>
        </div>
        
        <div class="back-button-wrapper">
          <NuxtLink to="/" class="back-button">Back to Home</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// About page - no additional logic needed
</script>

<style scoped>
.about-page {
  padding: 2rem;
  padding-bottom: 4rem;
  max-width: 1200px;
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

.about-content {
  color: #ffffff;
  font-size: 1.1rem;
  line-height: 1.8;
}

.intro-section {
  margin-bottom: 2rem;
  text-align: center;
}

.intro-section p {
  font-size: 1.2rem;
  font-weight: 500;
}

.features-section h2 {
  color: hsl(52, 100%, 50%);
  font-size: 2rem;
  margin-bottom: 1.5rem;
  text-align: center;
  font-family: 'Cinzel', serif;
}

.feature-block {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(20, 20, 20, 0.5);
  border-radius: 6px;
  border-left: 4px solid hsl(52, 100%, 50%);
}

.feature-block h3 {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
}

.feature-block p {
  margin-bottom: 1rem;
}

.feature-block p:last-child {
  margin-bottom: 0;
}

.note {
  font-style: italic;
  color: #ddd;
  padding: 0.75rem;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 4px;
  margin-top: 1rem;
}

.credit-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid hsl(52, 100%, 50%);
}

.credit-section h2 {
  color: hsl(52, 100%, 50%);
  font-size: 1.8rem;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
}

.credit-section p {
  margin-bottom: 0.5rem;
}

.credit-section a {
  color: hsl(52, 100%, 60%);
  text-decoration: none;
  transition: color 0.2s ease;
}

.credit-section a:hover {
  color: hsl(52, 100%, 70%);
  text-decoration: underline;
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

@media (max-width: 768px) {
  .about-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .about-content {
    font-size: 1rem;
  }
  
  .intro-section p {
    font-size: 1.1rem;
  }
  
  .features-section h2 {
    font-size: 1.5rem;
  }
  
  .feature-block {
    padding: 1rem;
  }
  
  .feature-block h3 {
    font-size: 1.3rem;
  }
}
</style>
