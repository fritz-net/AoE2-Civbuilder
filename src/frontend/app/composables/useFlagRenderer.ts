/**
 * Composable for rendering civilization flags on canvas
 * Extracted from FlagCreator.vue for reuse in DraftBoard and other components
 */
import { colours } from './useCivData'

/**
 * Renders a flag on a canvas element based on the provided palette
 * This is a complete port of the flag rendering logic from FlagCreator.vue
 * 
 * @param ctx - Canvas 2D context to draw on
 * @param palette - Array of 8 numbers defining the flag: [color1, color2, color3, color4, color5, division, overlay, symbol]
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @param symbolBasePath - Base path for symbol images (e.g., '/img/symbols' or '/v2/img/symbols')
 */
export function renderFlagOnCanvas(
  ctx: CanvasRenderingContext2D,
  palette: number[],
  width: number,
  height: number,
  symbolBasePath: string = '/img/symbols'
): void {
  // Clear canvas first to ensure clean state
  ctx.clearRect(0, 0, width, height)
  
  if (!palette || palette.length < 8) {
    // Draw a default gray flag if palette is invalid
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, width, height)
    return
  }

  // Get colors from palette
  const color1 = colours[palette[0]] || [128, 128, 128]
  const color2 = colours[palette[1]] || [128, 128, 128]
  const color3 = colours[palette[2]] || [128, 128, 128]
  const color4 = colours[palette[3]] || [128, 128, 128]
  const color5 = colours[palette[4]] || [128, 128, 128]
  const division = palette[5] || 0
  const overlay = palette[6] || 0
  const symbol = palette[7] || 0

  // Scale factor for drawing (original flag is 256x256)
  const scaleX = width / 256
  const scaleY = height / 256

  // Helper function to scale coordinates
  const sx = (x: number) => x * scaleX
  const sy = (y: number) => y * scaleY

  // Draw base color
  ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
  ctx.fillRect(0, 0, width, height)

  // Draw division pattern - matching legacy random_icon.js exactly
  switch (division) {
    case 0:
      // Solid - already filled
      break
    case 1:
      // Halves split vertically
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(128), sy(256))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(sx(128), 0, sx(128), sy(256))
      break
    case 2:
      // Halves split horizontally
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(256), sy(128))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, sy(128), sx(256), sy(128))
      break
    case 3:
      // Thirds split vertically
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(85), sy(256))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(sx(85), 0, sx(86), sy(256))
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(sx(171), 0, sx(85), sy(256))
      break
    case 4:
      // Thirds split horizontally
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(256), sy(85))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, sy(85), sx(256), sy(86))
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(0, sy(171), sx(256), sy(85))
      break
    case 5:
      // Quarters split orthogonally, opposite corners same color
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(128), sy(128))
      ctx.fillRect(sx(128), sy(128), sx(128), sy(128))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, sy(128), sx(128), sy(128))
      ctx.fillRect(sx(128), 0, sx(128), sy(128))
      break
    case 6:
      // Quarters split diagonally, opposite corners same color
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(128), sy(128))
      ctx.lineTo(0, sy(256))
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(sx(256), 0)
      ctx.lineTo(sx(128), sy(128))
      ctx.lineTo(sx(256), sy(256))
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(128), sy(128))
      ctx.lineTo(sx(256), 0)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, sy(256))
      ctx.lineTo(sx(128), sy(128))
      ctx.lineTo(sx(256), sy(256))
      ctx.closePath()
      ctx.fill()
      break
    case 7:
      // Halves split diagonally, top-left to bottom-right
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(256), sy(256))
      ctx.lineTo(sx(256), 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(256), sy(256))
      ctx.lineTo(0, sy(256))
      ctx.closePath()
      ctx.fill()
      break
    case 8:
      // Halves split diagonally, bottom-left to top-right
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.beginPath()
      ctx.moveTo(sx(256), 0)
      ctx.lineTo(0, sy(256))
      ctx.lineTo(0, 0)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      ctx.moveTo(sx(256), 0)
      ctx.lineTo(0, sy(256))
      ctx.lineTo(sx(256), sy(256))
      ctx.closePath()
      ctx.fill()
      break
    case 9:
      // Stripes vertically
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(28), sy(256))
      ctx.fillRect(sx(57), 0, sx(28), sy(256))
      ctx.fillRect(sx(114), 0, sx(28), sy(256))
      ctx.fillRect(sx(171), 0, sx(28), sy(256))
      ctx.fillRect(sx(228), 0, sx(28), sy(256))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(sx(28), 0, sx(29), sy(256))
      ctx.fillRect(sx(85), 0, sx(29), sy(256))
      ctx.fillRect(sx(142), 0, sx(29), sy(256))
      ctx.fillRect(sx(199), 0, sx(29), sy(256))
      break
    case 10:
      // Stripes horizontally
      ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
      ctx.fillRect(0, 0, sx(256), sy(28))
      ctx.fillRect(0, sy(57), sx(256), sy(28))
      ctx.fillRect(0, sy(114), sx(256), sy(28))
      ctx.fillRect(0, sy(171), sx(256), sy(28))
      ctx.fillRect(0, sy(228), sx(256), sy(28))
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, sy(28), sx(256), sy(29))
      ctx.fillRect(0, sy(85), sx(256), sy(29))
      ctx.fillRect(0, sy(142), sx(256), sy(29))
      ctx.fillRect(0, sy(199), sx(256), sy(29))
      break
    case 11:
      // Checkered
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
          } else {
            ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
          }
          const cellX = 37 * (Math.floor((i + 1) / 2)) + 36 * Math.floor(i / 2)
          const cellY = 37 * (Math.floor((j + 1) / 2)) + 36 * Math.floor(j / 2)
          const cellW = 36 + ((i + 1) % 2)
          const cellH = 36 + ((j + 1) % 2)
          ctx.fillRect(sx(cellX), sy(cellY), sx(cellW), sy(cellH))
        }
      }
      break
  }

  // Draw overlay pattern and determine symbol position & size
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
      ctx.fillRect(sx(104), 0, sx(48), sy(256))
      ctx.fillRect(0, sy(104), sx(256), sy(48))
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 2:
      ctx.fillRect(sx(71), 0, sx(48), sy(256))
      ctx.fillRect(0, sy(104), sx(256), sy(48))
      symbol_position_x = 0
      symbol_position_y = 33
      symbol_size = 190
      break
    case 3:
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(34), 0)
      ctx.lineTo(sx(256), sy(222))
      ctx.lineTo(sx(256), sy(256))
      ctx.lineTo(sx(222), sy(256))
      ctx.lineTo(0, sy(34))
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(sx(256), 0)
      ctx.lineTo(sx(256), sy(34))
      ctx.lineTo(sx(34), sy(256))
      ctx.lineTo(0, sy(256))
      ctx.lineTo(0, sy(222))
      ctx.lineTo(sx(222), 0)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 4:
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(34), 0)
      ctx.lineTo(sx(256), sy(222))
      ctx.lineTo(sx(256), sy(256))
      ctx.lineTo(sx(222), sy(256))
      ctx.lineTo(0, sy(34))
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 5:
      ctx.beginPath()
      ctx.moveTo(sx(256), 0)
      ctx.lineTo(sx(256), sy(34))
      ctx.lineTo(sx(34), sy(256))
      ctx.lineTo(0, sy(256))
      ctx.lineTo(0, sy(222))
      ctx.lineTo(sx(222), 0)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 24
      symbol_position_y = 24
      symbol_size = 208
      break
    case 6:
      ctx.beginPath()
      ctx.arc(sx(128), sy(128), sx(100), 0, 2 * Math.PI)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 48
      symbol_position_y = 48
      symbol_size = 160
      break
    case 7:
      ctx.beginPath()
      ctx.arc(0, sy(128), sx(128), -Math.PI / 2, Math.PI / 2)
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 3
      symbol_position_y = 73
      symbol_size = 110
      break
    case 8:
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(sx(196), sy(128))
      ctx.lineTo(0, sy(256))
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 8
      symbol_position_y = 78
      symbol_size = 100
      break
    case 9:
      ctx.beginPath()
      ctx.moveTo(sx(128), 0)
      ctx.lineTo(sx(256), sy(128))
      ctx.lineTo(sx(128), sy(256))
      ctx.lineTo(0, sy(128))
      ctx.closePath()
      ctx.fill()
      symbol_position_x = 64
      symbol_position_y = 64
      symbol_size = 128
      break
    case 10:
      ctx.fillRect(0, 0, sx(128), sy(128))
      symbol_position_x = 2
      symbol_position_y = 2
      symbol_size = 124
      break
    case 11:
      ctx.fillRect(sx(32), sy(32), sx(192), sy(192))
      symbol_position_x = 36
      symbol_position_y = 36
      symbol_size = 184
      break
  }

  // Draw symbol
  if (symbol > 0) {
    const symbolIndex = symbol - 1
    const symbolPath = `${symbolBasePath}/symbol_${symbolIndex}.png`

    // Load and draw symbol image
    const symbolImg = new Image()
    symbolImg.crossOrigin = 'anonymous'
    symbolImg.onload = () => {
      // Create a temporary canvas to process the symbol
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = 256
      tempCanvas.height = 256
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return

      // Draw the symbol image at the calculated position and size
      tempCtx.drawImage(symbolImg, symbol_position_x, symbol_position_y, symbol_size, symbol_size)

      // Get the image data to colorize it
      const symbolData = tempCtx.getImageData(0, 0, 256, 256)
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

      // Draw the colorized symbol on top of the flag (scaled)
      ctx.drawImage(tempCanvas, 0, 0, width, height)
    }
    symbolImg.onerror = (err) => {
      console.error('Failed to load symbol image:', symbolPath, err)
    }
    symbolImg.src = symbolPath
  }
}

/**
 * A simplified version that renders just the basic flag without symbols
 * Useful for smaller thumbnails where symbols would be hard to see
 * 
 * @param ctx - Canvas 2D context to draw on
 * @param palette - Array of at least 6 numbers defining the flag
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 */
export function renderFlagSimple(
  ctx: CanvasRenderingContext2D,
  palette: number[],
  width: number,
  height: number
): void {
  if (!palette || palette.length < 6) {
    // Draw a default gray flag if palette is invalid
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, width, height)
    return
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Get colors from palette
  const color1 = colours[palette[0]] || [128, 128, 128]
  const color2 = colours[palette[1]] || [128, 128, 128]
  const color3 = colours[palette[2]] || [128, 128, 128]
  const division = palette[5] || 0

  // Draw base color
  ctx.fillStyle = `rgb(${color1[0]}, ${color1[1]}, ${color1[2]})`
  ctx.fillRect(0, 0, width, height)

  // Draw division pattern (simplified - same as DraftBoard's original)
  switch (division) {
    case 0:
      // Solid - already filled
      break
    case 1:
      // Halves split vertically
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 2, 0, width / 2, height)
      break
    case 2:
      // Halves split horizontally
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 2, width, height / 2)
      break
    case 3:
      // Thirds split vertically
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 3, 0, width / 3, height)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(2 * width / 3, 0, width / 3, height)
      break
    case 4:
      // Thirds split horizontally
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 3, width, height / 3)
      ctx.fillStyle = `rgb(${color3[0]}, ${color3[1]}, ${color3[2]})`
      ctx.fillRect(0, 2 * height / 3, width, height / 3)
      break
    case 5:
      // Quarters - opposite corners same color
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(0, height / 2, width / 2, height / 2)
      ctx.fillRect(width / 2, 0, width / 2, height / 2)
      break
    case 7:
    case 8:
      // Diagonal halves
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.beginPath()
      if (division === 7) {
        ctx.moveTo(0, 0)
        ctx.lineTo(width, height)
        ctx.lineTo(0, height)
      } else {
        ctx.moveTo(width, 0)
        ctx.lineTo(0, height)
        ctx.lineTo(width, height)
      }
      ctx.closePath()
      ctx.fill()
      break
    default:
      // For other patterns, just show two colors
      ctx.fillStyle = `rgb(${color2[0]}, ${color2[1]}, ${color2[2]})`
      ctx.fillRect(width / 2, 0, width / 2, height)
  }
}

export function useFlagRenderer() {
  return {
    renderFlagOnCanvas,
    renderFlagSimple,
  }
}
