<template>
  <div class="techtree-page">
    <TechTree
      ref="techTreeRef"
      :initial-tree="initialTree"
      :editable="true"
      :points="startingPoints"
      :relative-path="relativePath"
      @done="handleDone"
      @update:tree="handleTreeUpdate"
      @update:points="handlePointsUpdate"
    />
  </div>
</template>

<script setup lang="ts">
const techTreeRef = ref<any>(null)

const initialTree = ref([
  [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
  [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
  [22, 101, 102, 103, 408],
])

const startingPoints = ref(100)
// The aoe2techtree assets are served from the main Express server at /civbuilder/aoe2techtree
const relativePath = '/civbuilder/aoe2techtree'

function handleDone(tree: number[][], points: number) {
  console.log('Tech tree completed:', { tree, points })
  // Navigate back or save the tree
}

function handleTreeUpdate(tree: number[][]) {
  console.log('Tree updated:', tree)
}

function handlePointsUpdate(points: number) {
  console.log('Points updated:', points)
}
</script>

<style scoped>
.techtree-page {
  width: 100%;
  min-height: 100vh;
}
</style>
