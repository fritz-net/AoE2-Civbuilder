<template>
  <div class="home-page">
    <h1 class="title">Civilization Builder</h1>
    
    <div class="action-buttons">
      <NuxtLink to="/build" class="action-button">
        Build Civilization
      </NuxtLink>
      
      <button class="action-button" @click="goToCombine">
        Combine Civilizations
      </button>
      
      <button class="action-button" @click="goToCreateDraft">
        Create Draft
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const goToCombine = () => {
  router.push('/combine')
}

const goToCreateDraft = () => {
  // TODO: Implement create draft page
  alert('Create Draft - Coming soon in Vue3 version!')
}
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 2rem;
  box-sizing: border-box;
}

.title {
  font-size: clamp(2rem, 8vw, 5rem);
  margin-bottom: 5vh;
  color: hsl(52, 100%, 50%);
  text-shadow: 3px 3px 5px black;
  text-align: center;
  font-family: 'Cinzel', serif;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 3vh;
  width: 100%;
  max-width: 600px;
}

.action-button {
  padding: clamp(0.8rem, 2vh, 1.5rem) clamp(1rem, 3vw, 2rem);
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.85), rgba(101, 67, 33, 0.85));
  color: hsl(52, 100%, 50%);
  border: 3px solid hsl(52, 100%, 50%);
  border-radius: 6px;
  cursor: pointer;
  font-size: clamp(1.2rem, 3vw, 2rem);
  font-family: 'Cinzel', serif;
  font-weight: normal;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

.action-button:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.8);
  border-color: hsl(52, 100%, 60%);
}

.action-button:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
}

@media (max-width: 768px) {
  .home-page {
    padding: 1rem;
  }
  
  .title {
    margin-bottom: 3vh;
  }
  
  .action-buttons {
    gap: 2vh;
  }
}

@media (max-height: 600px) {
  .title {
    margin-bottom: 2vh;
  }
  
  .action-buttons {
    gap: 1.5vh;
  }
  
  .action-button {
    padding: 0.6rem 1rem;
  }
}
</style>
