<template>
  <div class="demo-index">
    <h1>Component Demos</h1>
    <p class="description">Interactive demos and tests for various components</p>
    
    <div class="demo-grid">
      <NuxtLink to="/demo/techtree" class="demo-card">
        <div class="demo-card-icon">🌳</div>
        <h2>Tech Tree</h2>
        <p>Test both build and draft modes for the Tech Tree component</p>
      </NuxtLink>
      
      <NuxtLink to="/demo/timer" class="demo-card">
        <div class="demo-card-icon">⏱️</div>
        <h2>Timer Countdown</h2>
        <p>Interactive demo for the Timer Countdown component used in drafts</p>
      </NuxtLink>
      
      <NuxtLink to="/demo/custom-uu" class="demo-card">
        <div class="demo-card-icon">⚔️</div>
        <h2>Custom UU Editor</h2>
        <p>Design custom unique units with customizable stats, abilities, and balancing</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// No setup needed for now
</script>

<style scoped>
.demo-index {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  color: #d4af37;
  margin-bottom: 0.5rem;
  text-align: center;
}

.description {
  text-align: center;
  color: #666;
  margin-bottom: 3rem;
  font-size: 1.1rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.demo-card {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 2px solid #d4af37;
  border-radius: 12px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  cursor: pointer;
}

.demo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(212, 175, 55, 0.3);
  border-color: #b8941f;
}

.demo-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #e0e0e0 0%, #cccccc 100%);
  border-color: #999;
}

.demo-card.disabled:hover {
  transform: none;
  box-shadow: none;
}

.demo-card-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.demo-card h2 {
  font-size: 1.5rem;
  color: #4d3617;
  margin-bottom: 0.5rem;
  text-align: center;
}

.demo-card p {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
}
</style>
