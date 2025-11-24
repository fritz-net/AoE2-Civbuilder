<template>
  <div class="events-page">
    <h1 class="page-title">Events</h1>
    
    <div class="content-wrapper">
      <div class="events-content">
        <div class="no-events">
          <p class="no-events-text">
            No events are currently scheduled.
          </p>
          <p class="check-back">
            Check back later or join our Discord community to stay updated on upcoming tournaments, drafts, and special events!
          </p>
          
          <div class="discord-section">
            <h2>Join the Community</h2>
            <a href="https://discord.gg/vQxck6JDwf" target="_blank" rel="noopener noreferrer" class="discord-button">
              <img src="/img/kraken_invite.png" alt="Discord" class="discord-img" />
              <span>Join Krakenmeister's Maelstrom</span>
            </a>
          </div>
        </div>
        
        <div class="back-button-wrapper">
          <NuxtLink to="/" class="back-button">Back to Home</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Events page - placeholder for future event functionality
</script>

<style scoped>
.events-page {
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
  min-height: 50vh;
  display: flex;
  flex-direction: column;
}

.events-content {
  color: #ffffff;
  font-size: 1.1rem;
  line-height: 1.8;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-events {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.no-events-text {
  font-size: 1.5rem;
  color: hsl(52, 100%, 50%);
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
}

.check-back {
  font-size: 1.1rem;
  max-width: 600px;
  margin-bottom: 2rem;
}

.discord-section {
  margin-top: 2rem;
}

.discord-section h2 {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-family: 'Cinzel', serif;
}

.discord-button {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.85), rgba(101, 67, 33, 0.85));
  color: hsl(52, 100%, 50%);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  font-size: 1.1rem;
  font-family: 'Cinzel', serif;
  text-decoration: none;
  transition: all 0.3s ease;
}

.discord-button:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);
}

.discord-img {
  height: 40px;
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
  .events-page {
    padding: 1rem;
    padding-bottom: 3rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .no-events-text {
    font-size: 1.2rem;
  }
  
  .check-back {
    font-size: 1rem;
  }
}
</style>
