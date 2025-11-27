<template>
  <!-- This page redirects to /draft/create -->
</template>

<script setup lang="ts">
// Redirect /draft/ to /draft/create
definePageMeta({
  middleware: [
    () => {
      return navigateTo('/draft/create')
    }
  ]
})
</script>
