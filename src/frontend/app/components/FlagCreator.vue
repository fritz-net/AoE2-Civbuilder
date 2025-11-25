<template>
  <div class="flag-creator">
    <h2 class="section-title">Flag Creator</h2>
    
    <div class="flag-content">
      <div class="flag-controls">
        <div 
          v-for="(category, index) in flagCategories" 
          :key="index"
          class="flag-control-row"
        >
          <button class="nav-btn" @click="decrementPalette(index)">&lt;</button>
          <span class="category-label">{{ category }}</span>
          <button class="nav-btn" @click="incrementPalette(index)">&gt;</button>
        </div>
      </div>
      
      <div class="flag-preview">
        <canvas
          ref="flagCanvas"
          width="256"
          height="256"
          class="flag-canvas"
        ></canvas>
        
        <div class="custom-flag-options">
          <label class="custom-flag-checkbox">
            <input
              type="checkbox"
              v-model="useCustomFlag"
              @change="handleCustomFlagToggle"
            />
            <span>Use Custom Flag</span>
          </label>
          
          <label v-if="useCustomFlag" class="custom-flag-upload">
            <span>Choose Image</span>
            <input
              type="file"
              accept="image/*"
              @change="handleFileUpload"
              ref="fileInput"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { colours, flagCategories, paletteSizes } from '~/composables/useCivData'

const props = withDefaults(defineProps<{
  modelValue: number[]
  customFlag: boolean
  customFlagData: string
  disabled?: boolean
}>(), {
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
  (e: 'update:customFlag', value: boolean): void
  (e: 'update:customFlagData', value: string): void
}>()

const flagCanvas = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const useCustomFlag = ref(props.customFlag)
const customImage = ref<HTMLImageElement | null>(null)

const localPalette = ref([...props.modelValue])

function incrementPalette(index: number) {
  if (props.disabled) return
  const newPalette = [...localPalette.value]
  newPalette[index] = (newPalette[index] + 1) % paletteSizes[index]
  localPalette.value = newPalette
  emit('update:modelValue', newPalette)
  if (!useCustomFlag.value) {
    renderFlag()
  }
}

function decrementPalette(index: number) {
  if (props.disabled) return
  const newPalette = [...localPalette.value]
  newPalette[index] = (newPalette[index] - 1 + paletteSizes[index]) % paletteSizes[index]
  localPalette.value = newPalette
  emit('update:modelValue', newPalette)
  if (!useCustomFlag.value) {
    renderFlag()
  }
}

function handleCustomFlagToggle() {
  if (props.disabled) return
  emit('update:customFlag', useCustomFlag.value)
  if (!useCustomFlag.value) {
    renderFlag()
  } else if (customImage.value) {
    drawCustomImage()
  } else {
    clearCanvas()
  }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  
  const file = input.files[0]
  
  if (file.size > 800000) {
    alert('This is a large image file. This could slow mod creation speed or prohibit it altogether. A smaller or more compressed image is suggested.')
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    emit('update:customFlagData', result)
    
    const img = new Image()
    img.onload = () => {
      customImage.value = img
      drawCustomImage()
    }
    img.src = result
  }
  reader.readAsDataURL(file)
}

function drawCustomImage() {
  const canvas = flagCanvas.value
  if (!canvas || !customImage.value) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(customImage.value, 0, 0, 256, 256)
}

function clearCanvas() {
  const canvas = flagCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

function renderFlag() {
  const canvas = flagCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const palette = localPalette.value
  const width = canvas.width
  const height = canvas.height
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw base colors based on division pattern
  const division = palette[5]
  const color1 = colours[palette[0]]
  const color2 = colours[palette[1]]
  const color3 = colours[palette[2]]
  const color4 = colours[palette[3]]
  const color5 = colours[palette[4]]
  
  // Simple division patterns
  ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
  ctx.fillRect(0, 0, width, height)
  
  // Draw division pattern
  switch (division) {
    case 0: // Solid
      break
    case 1: // Horizontal half
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 2, width, height / 2)
      break
    case 2: // Vertical half
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 2, 0, width / 2, height)
      break
    case 3: // Diagonal
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(width, 0)
      ctx.lineTo(width, height)
      ctx.closePath()
      ctx.fill()
      break
    case 4: // Quarters
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 2, 0, width / 2, height / 2)
      ctx.fillRect(0, height / 2, width / 2, height / 2)
      break
    case 5: // Horizontal thirds
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 3, width, height / 3)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(0, (2 * height) / 3, width, height / 3)
      break
    case 6: // Vertical thirds
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 3, 0, width / 3, height)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect((2 * width) / 3, 0, width / 3, height)
      break
    case 7: // Cross
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 3, 0, width / 3, height)
      ctx.fillRect(0, height / 3, width, height / 3)
      break
    case 8: // Saltire (X cross)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(width / 4, 0)
      ctx.lineTo(width, (3 * height) / 4)
      ctx.lineTo(width, height)
      ctx.lineTo((3 * width) / 4, height)
      ctx.lineTo(0, height / 4)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(width, 0)
      ctx.lineTo((3 * width) / 4, 0)
      ctx.lineTo(0, (3 * height) / 4)
      ctx.lineTo(0, height)
      ctx.lineTo(width / 4, height)
      ctx.lineTo(width, height / 4)
      ctx.closePath()
      ctx.fill()
      break
    case 9: // Border
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 8, height / 8, (6 * width) / 8, (6 * height) / 8)
      break
    case 10: // Chevron
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(width / 2, height / 2)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()
      break
    case 11: // Diamond
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(width / 2, height / 6)
      ctx.lineTo((5 * width) / 6, height / 2)
      ctx.lineTo(width / 2, (5 * height) / 6)
      ctx.lineTo(width / 6, height / 2)
      ctx.closePath()
      ctx.fill()
      break
  }
  
  // Draw overlay pattern
  const overlay = palette[6]
  if (overlay > 0) {
    ctx.fillStyle = `rgb(${color4[0]}, ${color4[1]}, ${color4[2]})`
    switch (overlay) {
      case 1: // Small cross
        ctx.fillRect((2 * width) / 5, height / 4, width / 5, height / 2)
        ctx.fillRect(width / 4, (2 * height) / 5, width / 2, height / 5)
        break
      case 2: // Circle
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, width / 4, 0, 2 * Math.PI)
        ctx.fill()
        break
      case 3: // Star (simplified)
        drawStar(ctx, width / 2, height / 2, 5, width / 4, width / 8, color4)
        break
      case 4: // Triangle
        ctx.beginPath()
        ctx.moveTo(width / 2, height / 4)
        ctx.lineTo((3 * width) / 4, (3 * height) / 4)
        ctx.lineTo(width / 4, (3 * height) / 4)
        ctx.closePath()
        ctx.fill()
        break
      case 5: // Crescent
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, width / 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
        ctx.beginPath()
        ctx.arc(width / 2 + width / 10, height / 2, width / 5, 0, 2 * Math.PI)
        ctx.fill()
        break
      case 6: // Horizontal stripes
        for (let i = 0; i < 8; i += 2) {
          ctx.fillRect(0, (i * height) / 8, width, height / 8)
        }
        break
      case 7: // Vertical stripes
        for (let i = 0; i < 8; i += 2) {
          ctx.fillRect((i * width) / 8, 0, width / 8, height)
        }
        break
      case 8: // Corner triangle
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(width / 2, 0)
        ctx.lineTo(0, height / 2)
        ctx.closePath()
        ctx.fill()
        break
      case 9: // Two circles
        ctx.beginPath()
        ctx.arc(width / 3, height / 2, width / 6, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc((2 * width) / 3, height / 2, width / 6, 0, 2 * Math.PI)
        ctx.fill()
        break
      case 10: // Bend
        ctx.beginPath()
        ctx.moveTo(0, height / 4)
        ctx.lineTo(width / 4, 0)
        ctx.lineTo(width, (3 * height) / 4)
        ctx.lineTo((3 * width) / 4, height)
        ctx.closePath()
        ctx.fill()
        break
      case 11: // Pale (center stripe)
        ctx.fillRect(width / 3, 0, width / 3, height)
        break
    }
  }
  
  // Draw symbol
  const symbol = palette[7]
  if (symbol > 0) {
    ctx.fillStyle = `rgb(${color5[0]}, ${color5[1]}, ${color5[2]})`
    // For now, draw a simple symbol indicator
    const symbolSize = width / 8
    const cx = width / 2
    const cy = height / 2
    
    // Draw symbol number as text for placeholder
    ctx.font = `bold ${symbolSize}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(symbol.toString(), cx, cy)
  }
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: number[]) {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fill()
}

watch(() => props.modelValue, (newVal) => {
  localPalette.value = [...newVal]
  if (!useCustomFlag.value) {
    renderFlag()
  }
}, { deep: true })

watch(() => props.customFlag, (newVal) => {
  useCustomFlag.value = newVal
})

watch(() => props.customFlagData, (newVal) => {
  if (newVal && useCustomFlag.value) {
    const img = new Image()
    img.onload = () => {
      customImage.value = img
      drawCustomImage()
    }
    img.src = newVal
  }
})

onMounted(() => {
  nextTick(() => {
    if (props.customFlag && props.customFlagData) {
      const img = new Image()
      img.onload = () => {
        customImage.value = img
        drawCustomImage()
      }
      img.src = props.customFlagData
    } else {
      renderFlag()
    }
  })
})
</script>

<style scoped>
.flag-creator {
  background: rgba(139, 69, 19, 0.75);
  border: 2px solid hsl(52, 100%, 50%);
  padding: 1.5rem;
  border-radius: 8px;
}

.section-title {
  color: hsl(52, 100%, 50%);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.flag-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.flag-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.flag-control-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  width: 30px;
  height: 30px;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
  transform: translateY(-2px);
}

.category-label {
  width: 100px;
  text-align: center;
  color: hsl(52, 100%, 50%);
  font-size: 0.9rem;
}

.flag-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.flag-canvas {
  border: 4px solid black;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.custom-flag-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.custom-flag-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: hsl(52, 100%, 50%);
  cursor: pointer;
}

.custom-flag-checkbox input {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.custom-flag-upload {
  display: block;
  padding: 0.5rem 1rem;
  background: linear-gradient(to bottom, rgba(139, 69, 19, 0.9), rgba(101, 67, 33, 0.9));
  color: hsl(52, 100%, 50%);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.custom-flag-upload:hover {
  background: linear-gradient(to bottom, rgba(160, 82, 45, 0.95), rgba(139, 69, 19, 0.95));
}

.custom-flag-upload input {
  display: none;
}

@media (max-width: 768px) {
  .flag-content {
    flex-direction: column;
    align-items: center;
  }
}
</style>
