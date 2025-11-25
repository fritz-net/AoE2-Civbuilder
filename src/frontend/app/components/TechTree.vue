<template>
  <div class="techtree-container" :class="{ 'is-maximized': isMaximized }" :style="containerStyle">
    <div class="techtree-toolbar" :style="toolbarStyle">
      <div class="points">{{ pointsLabel }}: {{ techtreePoints }}</div>
      <button v-if="editable" class="toolbar-btn" @click="handleFill">Fill</button>
      <button v-if="editable" class="toolbar-btn" @click="handleReset">Reset</button>
      <button class="toolbar-btn primary" @click="handleDone">{{ doneButtonText }}</button>
    </div>

    <!-- Left Sidebar Panel -->
    <div v-if="showSidebar && sidebarContent" class="techtree-sidebar" :style="sidebarStyle">
      <div class="sidebar-header">
        <h2 class="sidebar-title">{{ sidebarTitle }}</h2>
        <button class="sidebar-toggle" @click="toggleSidebar" title="Hide Sidebar">×</button>
      </div>
      <!-- Note: sidebarContent is trusted HTML from the civ builder, not user input -->
      <div class="sidebar-content" v-html="formattedSidebarContent"></div>
    </div>

    <!-- Toggle Sidebar Button (when hidden) -->
    <button 
      v-if="!showSidebar && sidebarContent" 
      class="sidebar-show-btn" 
      @click="toggleSidebar"
      title="Show Sidebar"
    >
      ☰
    </button>

    <!-- Maximize button at top right of techtree (fixed position) -->
    <button 
      class="maximize-btn" 
      @click="toggleMaximize" 
      :title="isMaximized ? 'Exit Fullscreen' : 'Maximize'"
    >
      {{ isMaximized ? '⤓' : '⤢' }}
    </button>

    <div ref="techtreeRef" class="techtree" :style="techtreeStyle" @mouseleave="hideHelp" @wheel="handleWheel">
      <div class="svg-wrapper" :style="svgWrapperStyle">
        <svg
          ref="svgRef"
          :width="tree.width"
          :height="tree.height"
          class="techtree-svg"
        >
          <!-- Age Row Highlighters -->
          <rect
            :width="tree.width"
            :height="tree.height / 4"
            fill="#4d3617"
            fill-opacity="0.3"
            @mouseover="hideHelp"
          />
          <rect
            :width="tree.width"
            :height="tree.height / 4"
            :y="tree.height / 4 * 2"
            fill="#4d3617"
            fill-opacity="0.3"
            @mouseover="hideHelp"
          />

        <!-- Age Icons -->
        <g v-for="(age, index) in ageIcons" :key="age.name" @mouseover="hideHelp">
          <image
            :href="getAgePath(age.image)"
            :x="20"
            :y="tree.height / 4 * index + (tree.height / 4 - iconHeight) / 2 - 10"
            :width="112"
            :height="iconHeight"
          />
          <text
            :x="76"
            :y="tree.height / 4 * index + (tree.height / 4 - iconHeight) / 2 + iconHeight + 5"
            font-size="16"
            font-weight="bold"
            fill="#000000"
            fill-opacity="0.8"
            text-anchor="middle"
          >
            {{ age.displayName }}
          </text>
        </g>

        <!-- Connection Lines -->
        <g id="connection_lines">
          <polyline
            v-for="connection in visibleConnections"
            :key="`connection_${connection.from}_${connection.to}`"
            :points="getConnectionPath(connection)"
            :class="['connection', { 'is-highlight': isHighlighted(connection.from) || isHighlighted(connection.to) }]"
            @mouseover="hideHelp"
          />
        </g>

        <!-- Lane backgrounds -->
        <rect
          v-for="lane in tree.lanes"
          :key="`lane_${lane.x}`"
          :width="lane.width + 10"
          :height="tree.height"
          :x="lane.x - 10"
          :y="0"
          fill="#ffeeaa"
          fill-opacity="0"
          @mouseover="hideHelp"
        />

        <!-- Nodes -->
        <g
          v-for="caret in allCarets"
          :key="caret.id"
          :class="['node', { 'is-highlight': isHighlighted(caret.id) }]"
        >
          <!-- Background -->
          <rect
            :x="caret.x"
            :y="caret.y"
            :width="caret.width"
            :height="caret.height"
            :fill="getCaretColor(caret)"
          />

          <!-- Name text -->
          <text
            :x="caret.x + caret.width / 2"
            :y="caret.y + caret.height / 1.5"
            font-size="9"
            font-weight="bold"
            fill="#ffffff"
            fill-opacity="0.95"
            text-anchor="middle"
          >
            <tspan
              v-for="(line, lineIndex) in formatName(caret.name).split('\n')"
              :key="lineIndex"
              :x="caret.x + caret.width / 2"
              :dy="lineIndex === 0 ? 0 : '1.1em'"
            >
              {{ line }}
            </tspan>
          </text>

          <!-- Cost text -->
          <text
            :x="caret.x + caret.width / 1.1"
            :y="caret.y + 14"
            font-size="16"
            font-weight="bold"
            fill="#ffdd00"
            fill-opacity="0.95"
            text-anchor="middle"
          >
            {{ getCaretCost(caret.id) }}
          </text>

          <!-- Image placeholder -->
          <rect
            :x="caret.x + caret.width * 0.2"
            :y="caret.y"
            :width="caret.width * 0.6"
            :height="caret.height * 0.6"
            fill="#000000"
            fill-opacity="0.5"
          />

          <!-- Image -->
          <image
            :href="getImagePath(caret.id)"
            :x="caret.x + caret.width * 0.2"
            :y="caret.y"
            :width="caret.width * 0.6"
            :height="caret.height * 0.6"
          />

          <!-- Cross (disabled indicator) -->
          <image
            v-if="!isEnabled(caret.id)"
            :href="getCrossPath()"
            :x="caret.x + caret.width * 0.15"
            :y="caret.y - caret.height * 0.04"
            :width="caret.width * 0.7"
            :height="caret.height * 0.7"
            class="cross"
          />

          <!-- Overlay for interaction -->
          <rect
            :x="caret.x"
            :y="caret.y"
            :width="caret.width"
            :height="caret.height"
            class="node__overlay"
            @mouseover="showHelp(caret)"
            @mouseout="resetHighlight"
            @click="handleCaretClick(caret)"
          />
        </g>
        </svg>
      </div>

      <!-- Help tooltip -->
      <div
        v-if="helpVisible && focusedCaret"
        ref="helptextRef"
        class="helptext"
        :style="helptextStyle"
      >
        <div class="helptext__content" v-html="helpTextContent"></div>
      </div>
    </div>

    <!-- Side panel for description -->
    <div v-if="description" class="techtree-panel">
      <p class="description-text" v-html="description"></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { Caret, Tree, TechtreeData, LaneRows } from '~/composables/useTechtreeData'
import {
  TYPES,
  unclickableCarets,
  danglingCarets,
  regionalCarets,
} from '~/composables/useTechtreeData'
import {
  getDefaultTree,
  getConnections,
  getConnectionPoints,
  setTechtreeData,
  formatName,
  idType,
  idID,
  caretType,
  imagePrefix,
  cost,
} from '~/composables/useTechtree'

interface Props {
  initialTree?: number[][]
  editable?: boolean
  points?: number
  description?: string
  relativePath?: string
  sidebarContent?: string
  sidebarTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
  points: 0,
  description: '',
  relativePath: '/aoe2techtree',
  sidebarContent: '',
  sidebarTitle: 'Civilization Info',
})

const emit = defineEmits<{
  (e: 'done', tree: number[][], points: number): void
  (e: 'update:tree', tree: number[][]): void
  (e: 'update:points', points: number): void
}>()

// Refs
const techtreeRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const helptextRef = ref<HTMLDivElement | null>(null)

// State
const tree = ref<Tree>(getDefaultTree(typeof window !== 'undefined' ? window.innerHeight : 600))
const data = ref<TechtreeData | null>(null)
const localtree = ref<number[][]>([
  [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
  [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
  [22, 101, 102, 103, 408],
])
const techtreePoints = ref(props.points)
const focusedCaret = ref<Caret | null>(null)
const helpVisible = ref(false)
const highlightedIds = ref<Set<string>>(new Set())
const helptextStyle = ref<{ top: string; left: string; display: string }>({
  top: '0px',
  left: '0px',
  display: 'none',
})
const isMaximized = ref(false)
const showSidebar = ref(true)
const containerHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 600)

// Computed
const connections = computed(() => getConnections())
const connectionPoints = computed(() => getConnectionPoints(tree.value))
const parentConnections = computed(() => new Map(connections.value.map(([parent, child]) => [child, parent])))

// Scale factor to fit techtree in viewport without vertical scroll when not maximized
const techtreeScale = computed(() => {
  if (isMaximized.value) return 1
  // Calculate available height (viewport minus navbar ~60px, toolbar ~95px, padding ~20px)
  const navbarHeight = 60
  const toolbarHeight = 95
  const padding = 20
  const availableHeight = containerHeight.value - navbarHeight - toolbarHeight - padding
  const treeHeight = tree.value.height
  if (treeHeight > availableHeight && availableHeight > 100) {
    return Math.max(availableHeight / treeHeight, 0.4) // Minimum scale of 0.4
  }
  return 1
})

const backgroundUrl = computed(() => `${props.relativePath}/img/Backgrounds/bg_aoe2_hd_paper.jpg`)
const containerStyle = computed(() => ({
  background: `url('${backgroundUrl.value}') repeat`,
}))

// Apply scaling to SVG wrapper to fit techtree in viewport
const svgWrapperStyle = computed(() => {
  const scale = techtreeScale.value
  if (scale < 1) {
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: `${100 / scale}%`,
    }
  }
  return {}
})

const techtreeStyle = computed(() => ({
  background: `url('${backgroundUrl.value}') repeat local`,
}))
const toolbarStyle = computed(() => ({
  background: `url('${backgroundUrl.value}') repeat`,
}))
const sidebarStyle = computed(() => ({
  background: `url('${backgroundUrl.value}') repeat`,
}))

const visibleConnections = computed(() => {
  return connections.value
    .filter(([, child]) => !danglingCarets.includes(child))
    .map(([from, to]) => ({ from, to }))
})

const allCarets = computed(() => {
  const carets: Caret[] = []
  for (const lane of tree.value.lanes) {
    for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
      for (const caret of lane.rows[r]) {
        carets.push(caret)
      }
    }
  }
  return carets
})

const iconHeight = computed(() => Math.min(tree.value.height / 4 / 2, 112))

const ageIcons = computed(() => {
  const getAgeName = (key: string, fallback: string): string => {
    if (!data.value?.strings || !data.value?.age_names) return fallback
    const stringKey = data.value.age_names[key]
    return data.value.strings[stringKey] || fallback
  }
  
  return [
    { name: 'dark', image: 'dark_age_de.png', displayName: getAgeName('Dark Age', 'Dark Age') },
    { name: 'feudal', image: 'feudal_age_de.png', displayName: getAgeName('Feudal Age', 'Feudal Age') },
    { name: 'castle', image: 'castle_age_de.png', displayName: getAgeName('Castle Age', 'Castle Age') },
    { name: 'imperial', image: 'imperial_age_de.png', displayName: getAgeName('Imperial Age', 'Imperial Age') },
  ]
})

const pointsLabel = computed(() => props.editable ? 'Points Remaining' : 'Points Spent')

const doneButtonText = computed(() => 'Done')

// Format sidebar content with bold quantifiers
const formattedSidebarContent = computed(() => {
  if (!props.sidebarContent) return ''
  // Regex to match quantifiers like +15%, -10%, +1, +2, free, etc.
  // Only match when preceded by a space or start of text, and not inside HTML tags
  // This avoids breaking <h3> tags etc.
  return props.sidebarContent.replace(
    /(?<![<\w])(\+\d+%?|-\d+%?|\d+%|free\b)/gi,
    '<strong>$1</strong>'
  )
})

const helpTextContent = computed(() => {
  if (!focusedCaret.value || !data.value) return ''
  return getHelpText(focusedCaret.value)
})

// Handle window resize to update scale
function handleResize() {
  if (typeof window !== 'undefined') {
    containerHeight.value = window.innerHeight
  }
}

// Initialize
onMounted(async () => {
  await loadData()
  if (props.initialTree) {
    localtree.value = JSON.parse(JSON.stringify(props.initialTree))
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

watch(() => props.initialTree, (newTree) => {
  if (newTree) {
    localtree.value = JSON.parse(JSON.stringify(newTree))
    // Recalculate points when tree is loaded from props
    if (data.value && props.editable) {
      const usedPoints = calculatePoints()
      techtreePoints.value = props.points - usedPoints
      emit('update:points', techtreePoints.value)
    }
  }
}, { deep: true })

// Methods
async function loadData() {
  try {
    // Load data.json first
    const response = await fetch(`${props.relativePath}/data/data.json`)
    const jsonData = await response.json()
    
    // Load locale strings before setting the data
    const localeResponse = await fetch(`${props.relativePath}/data/locales/en/strings.json`)
    const strings = await localeResponse.json()
    jsonData.strings = strings
    
    // Now set the data with strings included
    data.value = jsonData
    setTechtreeData(jsonData)
    
    // Rebuild tree with data and names
    tree.value = getDefaultTree(typeof window !== 'undefined' ? window.innerHeight : 600)
    
    // Recalculate points after data is loaded if tree was already set
    if (props.editable && localtree.value.some(arr => arr.length > 0)) {
      const usedPoints = calculatePoints()
      techtreePoints.value = props.points - usedPoints
      emit('update:points', techtreePoints.value)
    }
  } catch (error) {
    console.error('Failed to load techtree data:', error)
  }
}

async function loadLocale(localeCode: string) {
  try {
    const response = await fetch(`${props.relativePath}/data/locales/${localeCode}/strings.json`)
    const strings = await response.json()
    if (data.value) {
      data.value.strings = strings
      setTechtreeData(data.value)
      // Rebuild tree with localized names
      tree.value = getDefaultTree(typeof window !== 'undefined' ? window.innerHeight : 600)
    }
  } catch (error) {
    console.error('Failed to load locale:', error)
  }
}

function getAgePath(image: string): string {
  return `${props.relativePath}/img/Ages/${image}`
}

function getImagePath(id: string): string {
  return `${props.relativePath}/img/${imagePrefix(id)}.jpg`
}

function getCrossPath(): string {
  return `${props.relativePath}/img/cross.png`
}

function getCaretColor(caret: Caret): string {
  if (regionalCarets.includes(caret.id)) {
    return '#4f3880'
  }
  return caret.type.colour
}

function getCaretCost(id: string): number {
  if (!data.value) return 0
  const type = caretType(id)
  const numId = idID(id).toString()
  return data.value.data[type]?.[numId]?.tech_cost || 0
}

function getConnectionPath(connection: { from: string; to: string }): string {
  const from = connectionPoints.value.get(connection.from)
  const to = connectionPoints.value.get(connection.to)
  if (!from || !to) return ''
  
  const intermediateHeight = from.y + (tree.value.element_height * 2) / 3
  return `${from.x},${from.y} ${from.x},${intermediateHeight} ${to.x},${intermediateHeight} ${to.x},${to.y}`
}

function isEnabled(id: string): boolean {
  const type = idType(id)
  const numId = idID(id)
  if (type < 0 || type >= localtree.value.length) return false
  return localtree.value[type].includes(numId)
}

function isHighlighted(id: string): boolean {
  return highlightedIds.value.has(id)
}

function showHelp(caret: Caret) {
  focusedCaret.value = caret
  helpVisible.value = true
  highlightPath(caret.id)
  
  nextTick(() => {
    positionHelptext(caret)
  })
}

function hideHelp() {
  focusedCaret.value = null
  helpVisible.value = false
  highlightedIds.value.clear()
  helptextStyle.value = { top: '0px', left: '0px', display: 'none' }
}

function resetHighlight() {
  highlightedIds.value.clear()
  if (focusedCaret.value) {
    highlightPath(focusedCaret.value.id)
  }
}

function highlightPath(caretId: string) {
  highlightedIds.value.add(caretId)
  
  const parentId = parentConnections.value.get(caretId)
  if (parentId) {
    highlightPath(parentId)
  }
}

function positionHelptext(caret: Caret) {
  if (!helptextRef.value || !techtreeRef.value) return
  
  const helpbox = helptextRef.value.getBoundingClientRect()
  const techtreeRect = techtreeRef.value.getBoundingClientRect()
  
  let top = caret.y + caret.height
  let left = caret.x - helpbox.width
  
  // Check if tooltip goes below the tree
  if (top + helpbox.height > tree.value.height) {
    top = caret.y - helpbox.height
  }
  
  // Check if tooltip goes out of view
  if (left < techtreeRef.value.scrollLeft) {
    left = techtreeRef.value.scrollLeft
  }
  
  helptextStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    display: 'block',
  }
}

function getHelpText(caret: Caret): string {
  if (!data.value) return ''
  
  const type = caret.type.type
  const entitytype = type === 'UNIT' || type === 'UNIQUEUNIT' ? 'units' : type === 'TECHNOLOGY' ? 'techs' : 'buildings'
  const id = idID(caret.id).toString()
  const meta = data.value.data[entitytype]?.[id]
  
  if (!meta) return '?'
  
  let text = data.value.strings[meta.LanguageHelpId] || '?'
  text = text.replace(/\s<br>/g, '')
  text = text.replace(/\n/g, '')
  
  if (type === 'TECHNOLOGY') {
    text = text.replace(
      /(.+?\(.+?\))(.*)/m,
      '<p class="helptext__heading">$1</p><p class="helptext__desc">$2</p><p class="helptext__stats">&nbsp;</p>'
    )
  } else if (type === 'UNIT' || type === 'UNIQUEUNIT') {
    text = text.replace(
      /(.+?\(‹cost›\))(.+?)<i>\s*(.+?)<\/i>(.*)/m,
      '<p>$1</p><p>$2</p><p><em>$3</em></p><p class="helptext__stats">$4</p>'
    )
  } else if (type === 'BUILDING') {
    text = text.replace(/<b><i>(.+?)<\/b><\/i>/m, '<b><em>$1</em></b>')
    if (text.indexOf('<i>') >= 0) {
      text = text.replace(
        /(.+?\(‹cost›\))(.+?)<i>\s*(.+?)<\/i>(.*)/m,
        '<p>$1</p><p>$2</p><p><em>$3</em></p><p class="helptext__stats">$4</p>'
      )
    } else {
      text = text.replace(
        /(.+?\(‹cost›\))(.*)<br>(.*)/m,
        '<p>$1</p><p>$2</p><p class="helptext__stats">$3</p>'
      )
    }
  }
  
  // Replace cost placeholder
  if (meta.Cost) {
    text = text.replace(/‹cost›/, 'Cost: ' + cost(meta.Cost))
  }
  
  // Build stats
  const stats: string[] = []
  if (text.match(/‹hp›/) && meta.HP !== undefined) {
    stats.push('HP:&nbsp;' + meta.HP)
  }
  if (text.match(/‹attack›/) && meta.Attack !== undefined) {
    stats.push('Attack:&nbsp;' + meta.Attack)
  }
  if (text.match(/‹[Aa]rmor›/) && meta.MeleeArmor !== undefined) {
    stats.push('Armor:&nbsp;' + meta.MeleeArmor)
  }
  if (text.match(/‹[Pp]iercearmor›/) && meta.PierceArmor !== undefined) {
    stats.push('Pierce armor:&nbsp;' + meta.PierceArmor)
  }
  if (text.match(/‹garrison›/) && meta.GarrisonCapacity !== undefined) {
    stats.push('Garrison:&nbsp;' + meta.GarrisonCapacity)
  }
  if (text.match(/‹range›/) && meta.Range !== undefined) {
    stats.push('Range:&nbsp;' + meta.Range)
  }
  
  if (stats.length > 0) {
    text = text.replace(
      /<p class="helptext__stats">(.+?)<\/p>/,
      '<h3>Stats</h3><p>' + stats.join(', ') + '</p>'
    )
  }
  
  return text
}

function handleCaretClick(caret: Caret) {
  if (!props.editable) return
  if (unclickableCarets.includes(caret.id)) return
  
  toggleCaret(caret.id)
}

function toggleCaret(caretId: string) {
  const type = idType(caretId)
  const id = idID(caretId)
  
  if (localtree.value[type].includes(id)) {
    disableCaret(caretId)
  } else {
    enableCaret(caretId)
  }
  
  emit('update:tree', localtree.value)
  emit('update:points', techtreePoints.value)
}

function enableCaret(caretId: string) {
  const type = idType(caretId)
  const id = idID(caretId)
  
  if (!localtree.value[type].includes(id)) {
    localtree.value[type].push(id)
    const techCost = getCaretCost(caretId)
    techtreePoints.value -= techCost
  }
  
  // Enable linked carets
  handleLinkedCarets(caretId, true)
  
  // Enable parent
  const parentId = parentConnections.value.get(caretId)
  if (parentId) {
    enableCaret(parentId)
  }
}

function disableCaret(caretId: string) {
  if (caretId === 'tech_408') return // Spies/Treason is always enabled
  
  const type = idType(caretId)
  const id = idID(caretId)
  
  const index = localtree.value[type].indexOf(id)
  if (index !== -1) {
    localtree.value[type].splice(index, 1)
    const techCost = getCaretCost(caretId)
    techtreePoints.value += techCost
  }
  
  // Disable children
  for (const connection of connections.value) {
    if (connection[0] === caretId) {
      disableCaret(connection[1])
    }
  }
  
  // Disable linked carets
  handleLinkedCarets(caretId, false)
}

function handleLinkedCarets(caretId: string, enable: boolean) {
  const linkedPairs: [string, string][] = [
    ['building_234', 'tech_140'],
    ['tech_64', 'building_236'],
    ['tech_63', 'building_235'],
    ['tech_194', 'building_155'],
    ['building_117', 'building_487'],
  ]
  
  for (const [a, b] of linkedPairs) {
    if (caretId === a) {
      enable ? enableCaret(b) : disableCaret(b)
    } else if (caretId === b) {
      enable ? enableCaret(a) : disableCaret(a)
    }
  }
  
  // Special cases for trebuchet-related units
  if (!enable && caretId === 'tech_47') {
    disableCaret('unit_5')
    disableCaret('unit_420')
    disableCaret('unit_36')
  }
  if (enable && (caretId === 'unit_5' || caretId === 'unit_420' || caretId === 'unit_36')) {
    enableCaret('tech_47')
  }
}

function handleFill() {
  localtree.value = [
    [
      13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440, 492, 24, 4, 5, 474, 39, 875, 873, 7, 6, 567, 473, 77, 75, 359, 358, 93, 752, 753, 751,
      441, 546, 448, 569, 283, 38, 330, 329, 1134, 1132, 1372, 1370, 548, 422, 1258, 1746, 1744, 588, 550, 280, 542, 279, 36, 1105, 532, 529,
      1103, 691, 420, 528, 527, 1104, 442, 1795, 1904, 1907, 1901, 1903, 1944, 1946, 1942, 1948,
    ],
    [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792, 236, 235, 234, 155, 117, 487],
    [
      435, 22, 101, 102, 103, 408, 47, 436, 437, 875, 215, 602, 39, 219, 212, 211, 201, 200, 199, 75, 68, 67, 80, 82, 81, 77, 76, 74, 375, 374,
      65, 373, 51, 50, 64, 377, 63, 140, 608, 380, 93, 194, 322, 54, 379, 321, 315, 233, 230, 45, 46, 316, 438, 441, 319, 439, 231, 252, 249, 213,
      280, 8, 182, 55, 279, 278, 221, 203, 202, 17, 23, 15, 48, 12, 13, 14,
    ],
  ]
  techtreePoints.value = calculatePoints()
  emit('update:tree', localtree.value)
  emit('update:points', techtreePoints.value)
}

function handleReset() {
  localtree.value = [
    [13, 17, 21, 74, 545, 539, 331, 125, 83, 128, 440],
    [12, 45, 49, 50, 68, 70, 72, 79, 82, 84, 87, 101, 103, 104, 109, 199, 209, 276, 562, 584, 598, 621, 792],
    [22, 101, 102, 103, 408],
  ]
  techtreePoints.value = props.points
  emit('update:tree', localtree.value)
  emit('update:points', techtreePoints.value)
}

function handleDone() {
  emit('done', localtree.value, techtreePoints.value)
}

function toggleMaximize() {
  isMaximized.value = !isMaximized.value
  
  // Use Fullscreen API when available
  if (typeof document !== 'undefined') {
    if (isMaximized.value) {
      const elem = document.documentElement
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {
          // Handle fullscreen request failure (user gesture required, permission denied, or API unavailable)
          // CSS-only fullscreen mode is still applied via the is-maximized class
        })
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          // Handle exit fullscreen failure gracefully - CSS mode will still work
        })
      }
    }
  }
}

function toggleSidebar() {
  showSidebar.value = !showSidebar.value
}

function handleWheel(event: WheelEvent) {
  // When scrolling over techtree area, scroll horizontally instead of vertically
  if (techtreeRef.value && event.deltaY !== 0) {
    event.preventDefault()
    techtreeRef.value.scrollLeft += event.deltaY
  }
}

function calculatePoints(): number {
  if (!data.value) return 0
  
  let points = 0
  for (const lane of tree.value.lanes) {
    for (const r of Object.keys(lane.rows) as (keyof LaneRows)[]) {
      for (const caret of lane.rows[r]) {
        if (isEnabled(caret.id)) {
          points += getCaretCost(caret.id)
        }
      }
    }
  }
  return points
}

// Expose for parent component access
defineExpose({
  localtree,
  techtreePoints,
  handleFill,
  handleReset,
  toggleMaximize,
  toggleSidebar,
  isMaximized,
  showSidebar,
})
</script>

<style scoped>
.techtree-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  min-height: 100vh;
  font-family: 'Merriweather', Georgia, 'Times New Roman', Times, serif;
  position: relative;
}

.techtree-container.is-maximized {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: row;
}

.techtree {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  border-left: 6px solid #4d3617;
  padding-bottom: 100px; /* Space for toolbar */
}

.is-maximized .techtree {
  overflow-y: auto;
  padding-bottom: 100px;
}

.svg-wrapper {
  display: inline-block;
  min-width: 100%;
}

.techtree-svg {
  display: block;
}

.techtree-toolbar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 3000;
  display: flex;
  gap: 0;
  padding: 0;
  width: 700px;
  height: 75px;
  background: rgba(245, 230, 200, 0.95);
  border: 2px solid #4d3617;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.is-maximized .techtree-toolbar {
  bottom: 20px;
  right: 20px;
}

.points {
  flex: 50%;
  color: black;
  font-size: 24px;
  text-align: left;
  vertical-align: middle;
  line-height: 75px;
  padding-left: 10px;
  cursor: default;
}

.toolbar-btn {
  flex: 12%;
  color: black;
  font-size: 24px;
  text-align: center;
  vertical-align: middle;
  line-height: 75px;
  cursor: pointer;
  outline: solid;
  outline-offset: -10px;
  background: transparent;
  border: none;
  font-family: inherit;
}

.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.toolbar-btn.primary {
  margin-right: 30px;
}

/* Maximize button at top right of techtree - fixed position so it doesn't scroll */
.maximize-btn {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 3001;
  background: rgba(77, 54, 23, 0.9);
  color: white;
  border: 2px solid #4d3617;
  padding: 8px 12px;
  font-size: 20px;
  cursor: pointer;
  border-radius: 4px;
  font-family: inherit;
}

.maximize-btn:hover {
  background: rgba(77, 54, 23, 1);
}

.is-maximized .maximize-btn {
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 10001;
}

/* Left Sidebar Styles */
.techtree-sidebar {
  width: 20rem;
  min-width: 20rem;
  height: calc(100vh - 90px); /* Leave space for toolbar */
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 1rem;
  border-right: 6px solid #4d3617;
  order: -1; /* Ensure it appears on the left */
}

.is-maximized .techtree-sidebar {
  position: relative;
  left: auto;
  top: auto;
  bottom: auto;
  z-index: auto;
  height: calc(100vh - 90px);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #4d3617;
}

.sidebar-title {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
  color: #4d3617;
}

.sidebar-toggle {
  background: transparent;
  border: 2px solid #4d3617;
  color: #4d3617;
  font-size: 20px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}

.sidebar-toggle:hover {
  background: rgba(0, 0, 0, 0.1);
}

.sidebar-content {
  font-size: 11pt;
  line-height: 1.5;
  color: #4d3617;
}

.sidebar-content :deep(h3) {
  font-size: 14pt;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #4d3617;
}

.sidebar-content :deep(ul) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.sidebar-content :deep(li) {
  margin-bottom: 0.3rem;
  color: #4d3617;
}

.sidebar-content :deep(p) {
  color: #4d3617;
}

.sidebar-content :deep(span) {
  font-size: 16pt;
  font-weight: bold;
  color: #4d3617;
}

.sidebar-content :deep(em) {
  color: #4d3617;
}

.sidebar-content :deep(hr) {
  border: none;
  border-top: 1px solid #4d3617;
  margin: 1rem 0;
}

/* Show sidebar button */
.sidebar-show-btn {
  position: fixed;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3001;
  background: rgba(77, 54, 23, 0.9);
  color: white;
  border: none;
  padding: 10px 8px;
  font-size: 20px;
  cursor: pointer;
  border-radius: 0 5px 5px 0;
}

.sidebar-show-btn:hover {
  background: rgba(77, 54, 23, 1);
}

.techtree-panel {
  width: 20rem;
  height: 100vh;
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 1rem;
  background: url('/aoe2techtree/img/Backgrounds/bg_aoe2_hd_paper.jpg') repeat;
}

.description-text {
  font-size: 13pt;
}

.node__overlay {
  fill: transparent;
  cursor: pointer;
}

.node.is-highlight .node__overlay {
  stroke: #fff;
  stroke-width: 3px;
}

.connection {
  fill: none;
  stroke: #000;
  stroke-width: 2px;
}

.connection.is-highlight {
  stroke: #fff;
  stroke-width: 3px;
}

.cross {
  pointer-events: none;
}

.helptext {
  position: absolute;
  width: 300px;
  background-color: #f5e6c8;
  border: 2px solid #4d3617;
  padding: 0.4rem;
  font-size: 10pt;
  z-index: 100;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
}

.helptext :deep(p) {
  margin-top: 0;
  margin-bottom: 15px;
}

.helptext :deep(h3) {
  font-family: sans-serif;
  font-size: 9pt;
  text-transform: uppercase;
  color: #4d3617;
  margin: 2px 10px 0 0;
  float: left;
}

.helptext :deep(.helptext__heading) {
  font-weight: bold;
}

@media (max-width: 900px) {
  .techtree {
    width: auto;
    overflow-x: auto;
  }
  
  .techtree-toolbar {
    width: 100%;
    max-width: 700px;
  }
  
  .techtree-sidebar {
    width: 16rem;
    min-width: 16rem;
  }
}
</style>
