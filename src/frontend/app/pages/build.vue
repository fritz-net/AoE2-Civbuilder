<template>
  <div class="build-page">
    <CivBuilder
      :initial-config="initialConfig"
      next-button-text="Continue to Bonuses"
      @next="handleNext"
      @download="handleDownload"
      @reset="handleReset"
    />
    
    <div class="back-navigation">
      <NuxtLink to="/" class="back-button">Back to Home</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CivConfig } from '~/composables/useCivData'

const router = useRouter()

const initialConfig = ref<Partial<CivConfig>>({})

function handleNext(config: CivConfig) {
  // Store config and navigate to bonus selection (placeholder for future implementation)
  console.log('Civ config:', config)
  alert(`Civilization "${config.alias}" configured successfully!\n\nBonus selection coming soon.`)
}

function handleDownload(config: CivConfig) {
  console.log('Downloaded config:', config)
}

function handleReset() {
  console.log('Config reset')
}
</script>

<style scoped>
.build-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 80vh;
}

.back-navigation {
  margin-top: 2rem;
  text-align: center;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: #d4af37;
  border: 2px solid #d4af37;
  text-decoration: none;
  font-size: 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
  display: inline-block;
}

.back-button:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .build-page {
    padding: 1rem;
  }
}
</style>
