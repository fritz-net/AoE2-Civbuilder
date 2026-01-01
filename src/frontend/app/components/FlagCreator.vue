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
          <!-- For colors (0-4), show dropdown with color names -->
          <select
            v-if="index < 5"
            :value="localPalette[index]"
            @change="handleDropdownChange(index, $event)"
            class="color-dropdown"
            :disabled="disabled || useCustomFlag"
            title="Select a preset color"
          >
            <option 
              v-for="(color, colorIndex) in colours" 
              :key="colorIndex" 
              :value="colorIndex"
              :style="{ backgroundColor: rgbToHex(color) }"
            >
              {{ getColorName(colorIndex) }}
            </option>
          </select>
          <!-- For Division, Overlay, Symbol (5-7), show dropdown with category as placeholder -->
          <select
            v-else
            :value="localPalette[index]"
            @change="handleDropdownChange(index, $event)"
            class="flag-dropdown"
            :disabled="disabled || useCustomFlag"
            :title="`Select ${category}`"
          >
            <option 
              v-for="optionIndex in paletteSizes[index]" 
              :key="optionIndex - 1" 
              :value="optionIndex - 1"
            >
              {{ category }} {{ optionIndex }}
            </option>
          </select>
          <button class="nav-btn" @click="incrementPalette(index)">&gt;</button>
          <!-- Add color picker for color categories (0-4) -->
          <input
            v-if="index < 5"
            type="color"
            :value="rgbToHex(getColor(index))"
            @input="handleColorPick(index, $event)"
            class="color-picker"
            :disabled="disabled || useCustomFlag"
            title="Pick a custom color"
          />
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
const customColors = ref<Map<number, number[]>>(new Map())

function incrementPalette(index: number) {
  if (props.disabled) return
  const newPalette = [...localPalette.value]
  newPalette[index] = (newPalette[index] + 1) % paletteSizes[index]
  localPalette.value = newPalette
  emit('update:modelValue', newPalette)
  
  // Clear custom color when cycling through presets
  if (index < 5) {
    customColors.value.delete(index)
  }
  
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
  
  // Clear custom color when cycling through presets
  if (index < 5) {
    customColors.value.delete(index)
  }
  
  if (!useCustomFlag.value) {
    renderFlag()
  }
}

// Helper function to convert RGB array to hex color
function rgbToHex(rgb: number[]): string {
  if (!rgb || rgb.length < 3) {
    return '#000000' // Default to black if invalid
  }
  const r = Math.max(0, Math.min(255, rgb[0])).toString(16).padStart(2, '0')
  const g = Math.max(0, Math.min(255, rgb[1])).toString(16).padStart(2, '0')
  const b = Math.max(0, Math.min(255, rgb[2])).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

// Helper function to convert hex color to RGB array
function hexToRgb(hex: string): number[] {
  if (!hex || typeof hex !== 'string' || hex.length < 7) {
    return [0, 0, 0] // Default to black if invalid
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  
  // Return black if parsing failed
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return [0, 0, 0]
  }
  
  return [r, g, b]
}

// Handle color picker input
function handleColorPick(index: number, event: Event) {
  if (props.disabled || useCustomFlag.value) return
  
  const input = event.target as HTMLInputElement
  const rgb = hexToRgb(input.value)
  
  // Store custom color for this index
  customColors.value.set(index, rgb)
  
  // Render flag with custom color
  if (!useCustomFlag.value) {
    renderFlag()
  }
}

// Handle dropdown change for preset color selection
function handleDropdownChange(index: number, event: Event) {
  if (props.disabled || useCustomFlag.value) return
  
  const select = event.target as HTMLSelectElement
  const newPalette = [...localPalette.value]
  newPalette[index] = parseInt(select.value)
  localPalette.value = newPalette
  emit('update:modelValue', newPalette)
  
  // Clear custom color when selecting a preset
  customColors.value.delete(index)
  
  if (!useCustomFlag.value) {
    renderFlag()
  }
}

// Get a friendly name for a color
function getColorName(colorIndex: number): string {
  const colorNames = [
    'Black',
    'White', 
    'Red',
    'Green',
    'Yellow',
    'Blue',
    'Orange',
    'Cyan',
    'Purple',
    'Magenta',
    'Mint',
    'Brown',
    'Gray',
    'Pink',
    'Light Blue',
  ]
  return colorNames[colorIndex] || `Color ${colorIndex + 1}`
}

// Helper to get color from palette with bounds checking (shared logic)
function getPaletteColor(index: number): number[] {
  // Validate index is within bounds for localPalette
  if (index < 0 || index >= localPalette.value.length) {
    return [0, 0, 0]
  }
  
  const paletteIndex = localPalette.value[index]
  if (paletteIndex >= 0 && paletteIndex < colours.length) {
    return colours[paletteIndex]
  }
  return [0, 0, 0] // Fallback to black if index is out of bounds
}

// Get the actual color to use (custom or from palette)
function getColor(index: number): number[] {
  // Validate index is within bounds
  if (index < 0 || index >= localPalette.value.length) {
    return [0, 0, 0]
  }
  
  // Check if there's a custom color for this palette index
  // Use optional chaining with fallback for safety
  return customColors.value.get(index) ?? getPaletteColor(index)
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
  const color1 = getColor(0)
  const color2 = getColor(1)
  const color3 = getColor(2)
  const color4 = getColor(3)
  const color5 = getColor(4)
  
  // Simple division patterns
  ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
  ctx.fillRect(0, 0, width, height)
  
  // Draw division pattern - matching legacy random_icon.js exactly
  // 0 = solid color background
  // 1 = halves split vertically
  // 2 = halves split horizontally
  // 3 = thirds split vertically
  // 4 = thirds split horizontally
  // 5 = quarters split orthogonally, opposite corners same color
  // 6 = quarters split diagonally, opposite corners same color
  // 7 = halves split diagonally, top-left to bottom-right
  // 8 = halves split diagonally, bottom-left to top-right
  // 9 = stripes vertically
  // 10 = stripes horizontally
  // 11 = checkered
  switch (division) {
    case 0:
      // Solid - already filled
      break
    case 1:
      // Halves split vertically
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 128, 256)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(128, 0, 128, 256)
      break
    case 2:
      // Halves split horizontally
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 256, 128)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, 128, 256, 128)
      break
    case 3:
      // Thirds split vertically
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 85, 256)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(85, 0, 86, 256)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(171, 0, 85, 256)
      break
    case 4:
      // Thirds split horizontally
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 256, 85)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, 85, 256, 86)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(0, 171, 256, 85)
      break
    case 5:
      // Quarters split orthogonally, opposite corners same color
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 128, 128)
      ctx.fillRect(128, 128, 128, 128)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, 128, 128, 128)
      ctx.fillRect(128, 0, 128, 128)
      break
    case 6:
      // Quarters split diagonally, opposite corners same color
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(128, 128)
      ctx.lineTo(0, 256)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(256, 0)
      ctx.lineTo(128, 128)
      ctx.lineTo(256, 256)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(128, 128)
      ctx.lineTo(256, 0)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, 256)
      ctx.lineTo(128, 128)
      ctx.lineTo(256, 256)
      ctx.closePath()
      ctx.fill()
      break
    case 7:
      // Halves split diagonally, top-left to bottom-right
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(256, 256)
      ctx.lineTo(256, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(256, 256)
      ctx.lineTo(0, 256)
      ctx.closePath()
      ctx.fill()
      break
    case 8:
      // Halves split diagonally, bottom-left to top-right
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.beginPath()
      ctx.moveTo(256, 0)
      ctx.lineTo(0, 256)
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(256, 0)
      ctx.lineTo(0, 256)
      ctx.lineTo(256, 256)
      ctx.closePath()
      ctx.fill()
      break
    case 9:
      // Stripes vertically
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 28, 256)
      ctx.fillRect(57, 0, 28, 256)
      ctx.fillRect(114, 0, 28, 256)
      ctx.fillRect(171, 0, 28, 256)
      ctx.fillRect(228, 0, 28, 256)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(28, 0, 29, 256)
      ctx.fillRect(85, 0, 29, 256)
      ctx.fillRect(142, 0, 29, 256)
      ctx.fillRect(199, 0, 29, 256)
      break
    case 10:
      // Stripes horizontally
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, 256, 28)
      ctx.fillRect(0, 57, 256, 28)
      ctx.fillRect(0, 114, 256, 28)
      ctx.fillRect(0, 171, 256, 28)
      ctx.fillRect(0, 228, 256, 28)
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, 28, 256, 29)
      ctx.fillRect(0, 85, 256, 29)
      ctx.fillRect(0, 142, 256, 29)
      ctx.fillRect(0, 199, 256, 29)
      break
    case 11:
      // Checkered
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if ((i + j) % 2 == 0) {
            ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
          } else {
            ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
          }
          ctx.fillRect(37 * (((i + 1) / 2) | 0) + 36 * ((i / 2) | 0), 37 * (((j + 1) / 2) | 0) + 36 * ((j / 2) | 0), 36 + ((i + 1) % 2), 36 + ((j + 1) % 2))
        }
      }
      break
  }
  
  // Draw overlay pattern and determine symbol position & size - matching legacy random_icon.js
  // 0 = no overlay
  // 1 = central cross
  // 2 = off-center cross
  // 3 = X
  // 4 = diagonal band, top-left to bottom-right
  // 5 = diagonal band, bottom-left to top-right
  // 6 = central circle
  // 7 = semicircle on left-edge
  // 8 = triangle on left-edge
  // 9 = central diamond
  // 10 = top-left quarter
  // 11 = central square
  const overlay = palette[6]
  let symbol_position_x = 0
  let symbol_position_y = 0
  let symbol_size = 256
  
  ctx.fillStyle = `rgb(${color4[0]}, ${color4[1]}, ${color4[2]})`
  switch (overlay) {
    case 0:
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 1:
      ctx.fillRect(104, 0, 48, 256)
      ctx.fillRect(0, 104, 256, 48)
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 2:
      ctx.fillRect(71, 0, 48, 256)
      ctx.fillRect(0, 104, 256, 48)
      symbol_position_x = 0
      symbol_position_y = 33
      symbol_size = 190
      break
    case 3:
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(34, 0)
      ctx.lineTo(256, 222)
      ctx.lineTo(256, 256)
      ctx.lineTo(222, 256)
      ctx.lineTo(0, 34)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(256, 0)
      ctx.lineTo(256, 34)
      ctx.lineTo(34, 256)
      ctx.lineTo(0, 256)
      ctx.lineTo(0, 222)
      ctx.lineTo(222, 0)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 4:
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(34, 0)
      ctx.lineTo(256, 222)
      ctx.lineTo(256, 256)
      ctx.lineTo(222, 256)
      ctx.lineTo(0, 34)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 5:
      ctx.beginPath()
      ctx.moveTo(256, 0)
      ctx.lineTo(256, 34)
      ctx.lineTo(34, 256)
      ctx.lineTo(0, 256)
      ctx.lineTo(0, 222)
      ctx.lineTo(222, 0)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 6:
      ctx.beginPath()
      ctx.arc(128, 128, 100, 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 48
      symbol_position_y = 48
      symbol_size = 160
      break
    case 7:
      ctx.beginPath()
      ctx.arc(0, 128, 128, -Math.PI / 2, Math.PI / 2)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 3
      symbol_position_y = 73
      symbol_size = 110
      break
    case 8:
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(196, 128)
      ctx.lineTo(0, 256)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 8
      symbol_position_y = 78
      symbol_size = 100
      break
    case 9:
      ctx.beginPath()
      ctx.moveTo(128, 0)
      ctx.lineTo(256, 128)
      ctx.lineTo(128, 256)
      ctx.lineTo(0, 128)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 64
      symbol_position_y = 64
      symbol_size = 128
      break
    case 10:
      ctx.fillRect(0, 0, 128, 128)
      symbol_position_x = 2
      symbol_position_y = 2
      symbol_size = 124
      break
    case 11:
      ctx.fillRect(32, 32, 192, 192)
      symbol_position_x = 36
      symbol_position_y = 36
      symbol_size = 184
      break
  }
  
  // Draw symbol - matching legacy random_icon.js
  const symbol = palette[7]
  if (symbol > 0) {
    // Load and draw the actual symbol image
    // Symbol palette value is 1-indexed, but files are 0-indexed
    const symbolIndex = symbol - 1
    // Use /v2 base path for Nuxt app
    const symbolPath = `/v2/img/symbols/symbol_${symbolIndex}.png`
    
    // Load symbol image
    const symbolImg = new Image()
    symbolImg.onload = () => {
      // Create a temporary canvas to process the symbol
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      
      // Draw the symbol image at the calculated position and size
      tempCtx.drawImage(symbolImg, symbol_position_x, symbol_position_y, symbol_size, symbol_size)
      
      // Get the image data to colorize it
      const symbolData = tempCtx.getImageData(0, 0, width, height)
      const pixels = symbolData.data
      
      // Colorize the symbol: replace non-transparent pixels with color5
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) { // If pixel is not transparent
          pixels[i] = color5[0]     // Red
          pixels[i + 1] = color5[1] // Green
          pixels[i + 2] = color5[2] // Blue
          pixels[i + 3] = 255       // Alpha
        }
      }
      
      // Put the colorized symbol data back
      tempCtx.putImageData(symbolData, 0, 0)
      
      // Draw the colorized symbol on top of the flag
      ctx.drawImage(tempCanvas, 0, 0)
    }
    symbolImg.onerror = (err) => {
      console.error('Failed to load symbol image:', symbolPath, err)
    }
    symbolImg.src = symbolPath
  }
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

.color-dropdown {
  width: 120px;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-dropdown:hover:not(:disabled) {
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.color-dropdown:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-dropdown option {
  background: rgba(139, 69, 19, 0.95);
  color: hsl(52, 100%, 50%);
  padding: 0.25rem;
}

.flag-dropdown {
  width: 120px;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  color: hsl(52, 100%, 50%);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.flag-dropdown:hover:not(:disabled) {
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.flag-dropdown:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.flag-dropdown option {
  background: rgba(139, 69, 19, 0.95);
  color: hsl(52, 100%, 50%);
  padding: 0.25rem;
}

.color-picker {
  width: 40px;
  height: 30px;
  border: 2px solid hsl(52, 100%, 50%);
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  transition: all 0.2s ease;
}

.color-picker:hover:not(:disabled) {
  border-color: hsl(52, 100%, 60%);
  box-shadow: 0 0 8px rgba(255, 204, 0, 0.4);
}

.color-picker:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
