<template>
  <div class="app-layout">
    <nav class="navigation" v-if="showNavigation">
      <NuxtLink to="/" class="nav-button">Home</NuxtLink>
      <NuxtLink to="/help" class="nav-button">Help</NuxtLink>
      <NuxtLink to="/about" class="nav-button">About</NuxtLink>
      <NuxtLink to="/events" class="nav-button">Events</NuxtLink>
      <NuxtLink to="/updates" class="nav-button">Updates</NuxtLink>
      <a :href="v1Url" class="nav-button classic-ui-link">Classic UI</a>
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

    <!-- Crosslink to classic v1 UI - Set crosslinkStyle to: "text", "button", "ribbon", "badge", "icon", or "fold" -->
    <div 
      v-if="showNavigation" 
      class="crosslink-container" 
      :data-crosslink-style="crosslinkStyle"
    >
      <!-- Version 1: Simple Text Link -->
      <a :href="v1Url" class="crosslink-text">← Classic UI (v1)</a>
      
      <!-- Version 2: Button Style -->
      <a :href="v1Url" class="crosslink-button">Classic v1</a>
      
      <!-- Version 3: Corner Ribbon -->
      <div class="crosslink-ribbon-wrapper">
        <div class="crosslink-ribbon-bow"></div>
        <a :href="v1Url" class="crosslink-ribbon">
          Classic UI
          <span class="crosslink-ribbon-label">v1</span>
        </a>
      </div>
      
      <!-- Version 4: Floating Badge -->
      <a :href="v1Url" class="crosslink-badge">
        <span>Classic UI</span>
      </a>
      
      <!-- Version 5: Icon-Based Link -->
      <a :href="v1Url" class="crosslink-icon">
        <span class="crosslink-icon-inner">
          <span class="crosslink-icon-arrow">←</span>
          <span>v1</span>
        </span>
        <span class="crosslink-tooltip">Switch to classic UI</span>
      </a>
      
      <!-- Version 6: Corner Fold -->
      <a :href="v1Url" class="crosslink-fold-wrapper">
        <div class="crosslink-fold"></div>
        <div class="crosslink-fold-shadow"></div>
        <span class="crosslink-fold-text">Classic v1</span>
      </a>
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

// URL to v1 (classic) UI
const v1Url = computed(() => {
  // Navigate to the parent path (from /v2 to /)
  const base = baseURL.replace(/\/v2\/?$/, '') || '/'
  return base
})

// Crosslink style - options: "text", "button", "ribbon", "badge", "icon", "fold"
const crosslinkStyle = ref('text')

// Hide navigation on certain pages (e.g., draft pages)
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

/* Classic UI menu link - subtle styling to indicate it goes to v1 */
.classic-ui-link {
  opacity: 0.85;
  font-size: min(1.8vh, 0.9vw) !important;
}

/* ============================================
 * Crosslink Styles
 * ============================================ */
.crosslink-container {
  --crosslink-gold: hsl(52, 100%, 50%);
  --crosslink-red: hsl(0, 100%, 34%);
  --crosslink-red-hover: hsl(0, 100%, 64%);
}

/* Hide all versions by default */
.crosslink-text,
.crosslink-button,
.crosslink-ribbon-wrapper,
.crosslink-badge,
.crosslink-icon,
.crosslink-fold-wrapper {
  display: none;
}

/* Version 1: Simple Text Link */
[data-crosslink-style="text"] .crosslink-text {
  display: block;
  position: fixed;
  bottom: 2vh;
  right: 2vw;
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  color: var(--crosslink-gold);
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.3s ease;
  z-index: 50;
}

[data-crosslink-style="text"] .crosslink-text:hover {
  opacity: 1;
  text-decoration: underline;
}

/* Version 2: Button Style Link */
[data-crosslink-style="button"] .crosslink-button {
  display: block;
  position: fixed;
  bottom: 2vh;
  right: 2vw;
  padding: 8px 16px;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  color: var(--crosslink-gold);
  background-color: var(--crosslink-red);
  border: 2px solid var(--crosslink-gold);
  text-decoration: none;
  text-shadow: 1px 1px 3px black;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  z-index: 50;
}

[data-crosslink-style="button"] .crosslink-button:hover {
  background-color: var(--crosslink-red-hover);
  transform: translateY(-2px);
}

/* Version 3: Corner Ribbon */
[data-crosslink-style="ribbon"] .crosslink-ribbon-wrapper {
  display: block;
  position: fixed;
  top: 0;
  right: 0;
  width: 150px;
  height: 150px;
  overflow: hidden;
  z-index: 100;
  pointer-events: none;
}

.crosslink-ribbon {
  position: absolute;
  top: 30px;
  right: -40px;
  width: 200px;
  padding: 10px 0;
  background: linear-gradient(135deg, var(--crosslink-red) 0%, hsl(0, 100%, 25%) 100%);
  color: var(--crosslink-gold);
  text-align: center;
  text-decoration: none;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  transform: rotate(45deg);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  cursor: pointer;
  transition: background 0.3s ease;
  border-top: 2px solid var(--crosslink-gold);
  border-bottom: 2px solid var(--crosslink-gold);
}

.crosslink-ribbon:hover {
  background: linear-gradient(135deg, var(--crosslink-red-hover) 0%, hsl(0, 100%, 40%) 100%);
}

.crosslink-ribbon-bow {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 60px 60px 0;
  border-color: transparent var(--crosslink-gold) transparent transparent;
  opacity: 0.3;
}

.crosslink-ribbon-label {
  display: block;
  font-size: 0.65rem;
  opacity: 0.9;
  margin-top: 2px;
}

/* Version 4: Floating Badge */
[data-crosslink-style="badge"] .crosslink-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  bottom: 15vh;
  right: 2vw;
  padding: 12px 18px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.95), rgba(101, 67, 33, 0.95));
  color: var(--crosslink-gold);
  text-decoration: none;
  font-family: 'Cinzel', serif;
  font-size: 0.85rem;
  border: 2px solid var(--crosslink-gold);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

[data-crosslink-style="badge"] .crosslink-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.8);
}

/* Version 5: Icon-Based Link */
[data-crosslink-style="icon"] .crosslink-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 2vh;
  right: 2vw;
  width: 50px;
  height: 50px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: var(--crosslink-gold);
  text-decoration: none;
  font-family: 'Cinzel', serif;
  border: 2px solid var(--crosslink-gold);
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.3s ease, background 0.3s ease;
}

[data-crosslink-style="icon"] .crosslink-icon:hover {
  transform: scale(1.1);
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
}

.crosslink-icon-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.7rem;
  line-height: 1.1;
}

.crosslink-icon-arrow {
  font-size: 1.2rem;
  margin-bottom: 2px;
}

.crosslink-icon .crosslink-tooltip {
  visibility: hidden;
  position: absolute;
  right: 60px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.crosslink-icon:hover .crosslink-tooltip {
  visibility: visible;
  opacity: 1;
}

/* Version 6: Corner Fold */
[data-crosslink-style="fold"] .crosslink-fold-wrapper {
  display: block;
}

.crosslink-fold-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  z-index: 100;
  cursor: pointer;
}

.crosslink-fold {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 100px 100px 0;
  border-color: transparent var(--crosslink-red) transparent transparent;
  transition: border-width 0.3s ease;
}

.crosslink-fold-wrapper:hover .crosslink-fold {
  border-width: 0 120px 120px 0;
}

.crosslink-fold-text {
  position: absolute;
  top: 22px;
  right: 8px;
  color: var(--crosslink-gold);
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  transform: rotate(45deg);
  white-space: nowrap;
  pointer-events: none;
}

.crosslink-fold-shadow {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 30px 30px 0;
  border-color: transparent rgba(0, 0, 0, 0.3) transparent transparent;
}

/* Hide on very small screens */
@media only screen and (max-width: 500px) {
  .crosslink-container {
    display: none;
  }
}
</style>
