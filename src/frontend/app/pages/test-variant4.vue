<template>
  <NuxtLayout name="variant4">
    <div class="demo-page">
      <h1>GitHub Link - Variant 4</h1>
      <p>Icon-only circular button in top-right</p>
      <ul>
        <li>Circular icon-only button in top-right corner</li>
        <li>Greyish color scheme (not red)</li>
        <li>Compact, minimal design</li>
        <li>Tooltip shows "Bug Tracker" on hover</li>
      </ul>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.demo-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 8px;
}

.demo-page h1 {
  color: hsl(52, 100%, 50%);
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.demo-page p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #d0d0d0;
}

.demo-page ul {
  list-style-type: none;
  padding: 0;
}

.demo-page li {
  font-size: 1rem;
  margin-bottom: 0.5rem;
  color: #b0b0b0;
  padding-left: 1.5rem;
  position: relative;
}

.demo-page li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: hsl(52, 100%, 50%);
}
</style>
