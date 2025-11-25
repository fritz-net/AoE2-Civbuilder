<template>
  <div class="techtree-page">
    <TechTree
      ref="techTreeRef"
      :initial-tree="initialTree"
      :editable="true"
      :points="startingPoints"
      :relative-path="relativePath"
      :sidebar-content="sidebarContent"
      :sidebar-title="sidebarTitle"
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

const sidebarTitle = 'Custom Civilization'

// Sample civilization info content - this would typically come from the civ builder
const sidebarContent = `
<span>Sample Custom Civ</span>
<p><em>Infantry & Archer civilization</em></p>

<h3>Civilization Bonuses</h3>
<ul>
  <li>Infantry units +10% HP in Feudal Age, +15% in Castle Age, +20% in Imperial Age</li>
  <li>Archers cost -15% gold</li>
  <li>Town Centers work 10% faster</li>
  <li>Blacksmith upgrades free</li>
</ul>

<hr>

<h3>Unique Unit</h3>
<p><strong>Elite Guard</strong> - A heavily armored infantry unit with bonus damage against cavalry.</p>

<h3>Unique Technologies</h3>
<ul>
  <li><strong>Castle Age:</strong> Battle Tactics - Infantry +1 attack, +1 armor</li>
  <li><strong>Imperial Age:</strong> Elite Training - Barracks units train 50% faster</li>
</ul>

<hr>

<h3>Team Bonus</h3>
<p>Barracks units +2 line of sight</p>
`

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
