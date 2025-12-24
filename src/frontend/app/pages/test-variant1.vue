<template>
  <NuxtLayout name="variant1">
    <div class="demo-page">
      <h1>GitHub Link - Variant 1</h1>
      <p>Left navigation menu with icon + text "Bug Tracker"</p>
      <ul>
        <li>GitHub icon with text in left navigation menu</li>
        <li>Greyish color scheme (not red)</li>
        <li>Consistent with other nav buttons</li>
        <li>Clear labeling as "Bug Tracker"</li>
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
