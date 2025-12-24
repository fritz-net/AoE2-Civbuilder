<template>
  <div class="app-layout">
    <nav class="navigation" v-if="showNavigation">
      <NuxtLink to="/" class="nav-button">Home</NuxtLink>
      <NuxtLink to="/help" class="nav-button">Help</NuxtLink>
      <NuxtLink to="/about" class="nav-button">About</NuxtLink>
      <NuxtLink to="/events" class="nav-button">Events</NuxtLink>
      <NuxtLink to="/updates" class="nav-button">Updates</NuxtLink>
      <a :href="v1Url" class="nav-button classic-ui-link">Classic UI</a>
      
      <!-- VARIANT 5: Combined icon+text in left menu, more prominent -->
      <a :href="githubUrl" target="_blank" rel="noopener noreferrer" class="nav-button github-link-prominent">
        <img :src="githubIconSrc" alt="GitHub" class="github-icon" />
        <span>Bug Tracker</span>
      </a>
    </nav>
    
    <div class="top-right-links" v-if="showNavigation">
      <a href="https://discord.gg/vQxck6JDwf" target="_blank" rel="noopener noreferrer">
        <img 
          :src="discordImageSrc" 
          alt="Krakenmeister's Maelstrom" 
          class="discord-invite"
        />
      </a>
      <a href="https://www.buymeacoffee.com/krakenmeister" target="_blank" rel="noopener noreferrer" class="donate-button">Donate</a>
    </div>
    
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const baseURL = config.app.baseURL || '/v2/'

const discordImageSrc = computed(() => `${baseURL}img/kraken_invite.png`)
const githubIconSrc = computed(() => `${baseURL}img/github-icon.svg`)

// Determine GitHub URL based on hostname
const githubUrl = computed(() => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'krakenmeister.com' || hostname === 'www.krakenmeister.com') {
      return 'https://github.com/Krakenmeister/AoE2-Civbuilder/issues'
    }
  }
  return 'https://github.com/fritz-net/AoE2-Civbuilder/issues'
})

// URL to v1 (classic) UI
const v1Url = computed(() => {
  const base = baseURL.replace(/\/v2\/?$/, '') || '/'
  return base
})

// Hide navigation on certain pages
const showNavigation = computed(() => {
  return !route.path.includes('/draft/')
})
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navigation {
  position: fixed;
  width: 10vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  bottom: 5vh;
  left: 2vw;
  gap: min(1vw, 2vh);
  z-index: 100;
}

.nav-button {
  padding: min(1vw, 2vh) min(1.5vw, 3vh);
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  font-size: min(2vh, 1vw);
  font-family: 'Cinzel', serif;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  width: 100%;
}

.nav-button:hover:not(:disabled) {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* VARIANT 5 STYLES: Prominent icon+text with darker greyish background */
.github-link-prominent {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  background: linear-gradient(to bottom, rgba(80, 80, 85, 0.95), rgba(50, 50, 55, 0.95));
  color: #b8b8b8;
  border: 2px solid #7a7a7a;
  padding: min(1.2vw, 2.4vh) min(1.5vw, 3vh);
}

.github-link-prominent:hover {
  background: linear-gradient(to bottom, rgba(100, 100, 105, 0.98), rgba(70, 70, 75, 0.98));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.7);
}

.github-link-prominent .github-icon {
  width: 22px;
  height: 22px;
  filter: brightness(0.85);
}

.github-link-prominent span {
  font-size: min(1.6vh, 0.8vw);
  text-align: center;
}

.content {
  flex: 1;
  padding: 2rem;
  color: white;
}

.top-right-links {
  position: fixed;
  top: 2vh;
  right: 2vw;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
  z-index: 100;
}

.discord-invite {
  height: 50px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.discord-invite:hover {
  transform: scale(1.05);
}

.donate-button {
  padding: min(1vw, 2vh) min(1.5vw, 3vh);
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  font-size: min(2vh, 1vw);
  font-family: 'Cinzel', serif;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.donate-button:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

.classic-ui-link {
  opacity: 0.85;
  font-size: min(1.8vh, 0.9vw) !important;
}
</style>
