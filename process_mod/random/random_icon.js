//Pure JS image generation using pngjs
const fs = require("fs");
const { PNG } = require("pngjs");

// Constants
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const SEMICIRCLE_ANGLE_STEP = 0.1;

// Helper class to simulate canvas operations using pngjs
class PNGCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.png = new PNG({ width, height });
    this.fillStyle = { r: 0, g: 0, b: 0, a: 255 };
  }

  setFillStyle(color) {
    // Parse RGB color strings like "rgb(255, 255, 255)"
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      this.fillStyle = {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: 255,
      };
    } else {
      // Fallback to black for unrecognized formats
      console.warn(`Unrecognized color format: ${color}, using black`);
      this.fillStyle = { r: 0, g: 0, b: 0, a: 255 };
    }
  }

  fillRect(x, y, width, height) {
    const startX = Math.max(0, Math.floor(x));
    const startY = Math.max(0, Math.floor(y));
    const endX = Math.min(this.width, Math.ceil(x + width));
    const endY = Math.min(this.height, Math.ceil(y + height));

    for (let py = startY; py < endY; py++) {
      for (let px = startX; px < endX; px++) {
        const idx = (this.width * py + px) << 2;
        this.png.data[idx] = this.fillStyle.r;
        this.png.data[idx + 1] = this.fillStyle.g;
        this.png.data[idx + 2] = this.fillStyle.b;
        this.png.data[idx + 3] = this.fillStyle.a;
      }
    }
  }

  // Helper to draw a line using Bresenham's algorithm
  drawLine(x0, y0, x1, y1) {
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.setPixel(x0, y0);

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  setPixel(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const idx = (this.width * y + x) << 2;
      this.png.data[idx] = this.fillStyle.r;
      this.png.data[idx + 1] = this.fillStyle.g;
      this.png.data[idx + 2] = this.fillStyle.b;
      this.png.data[idx + 3] = this.fillStyle.a;
    }
  }

  // Fill a polygon defined by an array of points
  fillPolygon(points) {
    if (points.length < 3) return;

    // Find bounding box
    let minY = this.height;
    let maxY = 0;
    for (const point of points) {
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    minY = Math.max(0, Math.floor(minY));
    maxY = Math.min(this.height - 1, Math.ceil(maxY));

    // Scanline fill algorithm
    for (let y = minY; y <= maxY; y++) {
      const intersections = [];

      // Find all intersections with this scanline
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        const p1 = points[i];
        const p2 = points[j];

        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
          const x = p1.x + ((y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x);
          intersections.push(x);
        }
      }

      // Sort intersections
      intersections.sort((a, b) => a - b);

      // Fill between pairs of intersections
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          const x1 = Math.max(0, Math.floor(intersections[i]));
          const x2 = Math.min(this.width - 1, Math.ceil(intersections[i + 1]));
          for (let x = x1; x <= x2; x++) {
            this.setPixel(x, y);
          }
        }
      }
    }
  }

  // Draw a circle
  fillCircle(cx, cy, radius) {
    const r2 = radius * radius;
    const startY = Math.max(0, Math.floor(cy - radius));
    const endY = Math.min(this.height - 1, Math.ceil(cy + radius));
    const startX = Math.max(0, Math.floor(cx - radius));
    const endX = Math.min(this.width - 1, Math.ceil(cx + radius));

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.setPixel(x, y);
        }
      }
    }
  }

  getImageData() {
    return {
      data: this.png.data,
      width: this.width,
      height: this.height,
    };
  }

  putImageData(imageData) {
    this.png.data = Buffer.from(imageData.data);
  }

  toBuffer() {
    return PNG.sync.write(this.png);
  }
}

// Load a PNG image and return a PNGCanvas-like object
async function loadImage(path) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path)
      .pipe(new PNG())
      .on("parsed", function () {
        resolve({
          width: this.width,
          height: this.height,
          data: this.data,
        });
      })
      .on("error", reject);
  });
}

module.exports = {
  getRandomInt,
  generateSeed,
  drawFlag,
  generateFlags,
};

//Generate a random integer from 0 to n-1 (inclusive)
function getRandomInt(n) {
  return Math.floor(Math.random() * Math.floor(n));
}

//Generate random colour palette, division, overlay, and symbol
function generateSeed() {
  //Division is an integer representing the background pattern
  var division = getRandomInt(12);

  //Overlay is an integer representing the foreground pattern
  var overlay = getRandomInt(12);

  //Colour palette is a 2D array -- 5 colors each with an length-3 array holding RGB values
  var colour_palette = [];

  //Database of colours
  const white = [255, 255, 255];
  const yellow = [242, 245, 86];
  const light_blue = [153, 255, 238];
  const pink = [240, 185, 185];
  const light_green = [191, 255, 128];
  const orange = [230, 134, 9];

  const black = [0, 0, 0];
  const dark_blue = [1, 5, 128];
  const dark_green = [21, 128, 0];
  const purple = [51, 0, 77];
  const scarlet = [102, 0, 34];
  const red = [201, 34, 22];
  const brown = [51, 8, 0];

  var light_colours = [white, yellow, light_blue, pink, light_green, orange];
  var dark_colours = [black, dark_blue, dark_green, purple, scarlet, red, brown];

  //Create a colour palette with good contrast
  var randInt = getRandomInt(2);
  if (overlay < 6) {
    if (randInt == 0) {
      for (var i = 0; i < 4; i++) {
        colour_palette.push(light_colours[getRandomInt(light_colours.length)]);
      }
      colour_palette.push(dark_colours[getRandomInt(dark_colours.length)]);
    } else {
      for (var i = 0; i < 4; i++) {
        colour_palette.push(dark_colours[getRandomInt(dark_colours.length)]);
      }
      colour_palette.push(light_colours[getRandomInt(light_colours.length)]);
    }
  } else {
    for (var i = 0; i < 3; i++) {
      var j = getRandomInt(light_colours.length + dark_colours.length);
      if (j >= light_colours.length) {
        colour_palette.push(dark_colours[j - light_colours.length]);
      } else {
        colour_palette.push(light_colours[j]);
      }
    }
    if (randInt == 0) {
      colour_palette.push(light_colours[getRandomInt(light_colours.length)]);
      if (dark_colours.includes(colour_palette[0])) {
        colour_palette.push(colour_palette[0]);
      } else {
        colour_palette.push(dark_colours[getRandomInt(dark_colours.length)]);
      }
    } else {
      colour_palette.push(dark_colours[getRandomInt(dark_colours.length)]);
      if (light_colours.includes(colour_palette[0])) {
        colour_palette.push(colour_palette[0]);
      } else {
        colour_palette.push(light_colours[getRandomInt(light_colours.length)]);
      }
    }
  }

  var seed = [colour_palette, division, overlay];
  return seed;
}

//Draw flag to canvas given a seed
async function drawFlag(seed, symbol, output_paths, input_path) {
  var colour_palette = seed[0];
  var division = seed[1];
  var overlay = seed[2];

  var primary_division_colour = "rgb(" + colour_palette[0][0] + ", " + colour_palette[0][1] + ", " + colour_palette[0][2] + ")";
  var secondary_division_colour = "rgb(" + colour_palette[1][0] + ", " + colour_palette[1][1] + ", " + colour_palette[1][2] + ")";
  var tertiary_division_colour = "rgb(" + colour_palette[2][0] + ", " + colour_palette[2][1] + ", " + colour_palette[2][2] + ")";
  var overlay_colour = "rgb(" + colour_palette[3][0] + ", " + colour_palette[3][1] + ", " + colour_palette[3][2] + ")";
  var image_path = input_path + "/symbol_" + symbol + ".png";

  const width = CANVAS_WIDTH;
  const height = CANVAS_HEIGHT;
  const canvas = new PNGCanvas(width, height);
  canvas.setFillStyle("rgb(0, 0, 0)");
  canvas.fillRect(0, 0, width, height);

  //Create separate canvas for symbol
  const canvas2 = new PNGCanvas(width, height);

  //Draw background
  //0 = solid color background
  //1 = halves split vertically
  //2 = halves split horizontally
  //3 = thirds split vertically
  //4 = thirds split horizontally
  //5 = quarters split orthogonally, opposite corners same color
  //6 = quarters split diagonally, opposite corners same color
  //7 = halves split diagonally, top-left to bottom-right
  //8 = halves split diagonally, bottom-left to top-right
  //9 = stripes vertically
  //10 = stripes horizontally
  //11 = checkered
  switch (division) {
    case 0:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 256, 256);
      break;
    case 1:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 128, 256);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(128, 0, 128, 256);
      break;
    case 2:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 256, 128);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(0, 128, 256, 128);
      break;
    case 3:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 85, 256);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(85, 0, 86, 256);
      canvas.setFillStyle(tertiary_division_colour);
      canvas.fillRect(171, 0, 85, 256);
      break;
    case 4:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 256, 85);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(0, 85, 256, 86);
      canvas.setFillStyle(tertiary_division_colour);
      canvas.fillRect(0, 171, 256, 85);
      break;
    case 5:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 128, 128);
      canvas.fillRect(128, 128, 128, 128);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(0, 128, 128, 128);
      canvas.fillRect(128, 0, 128, 128);
      break;
    case 6:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 0, y: 256 },
      ]);
      canvas.fillPolygon([
        { x: 256, y: 0 },
        { x: 128, y: 128 },
        { x: 256, y: 256 },
      ]);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 128, y: 128 },
        { x: 256, y: 0 },
      ]);
      canvas.fillPolygon([
        { x: 0, y: 256 },
        { x: 128, y: 128 },
        { x: 256, y: 256 },
      ]);
      break;
    case 7:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 256, y: 256 },
        { x: 256, y: 0 },
      ]);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 256, y: 256 },
        { x: 0, y: 256 },
      ]);
      break;
    case 8:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillPolygon([
        { x: 256, y: 0 },
        { x: 0, y: 256 },
        { x: 0, y: 0 },
      ]);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillPolygon([
        { x: 256, y: 0 },
        { x: 0, y: 256 },
        { x: 256, y: 256 },
      ]);
      break;
    case 9:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 28, 256);
      canvas.fillRect(57, 0, 28, 256);
      canvas.fillRect(114, 0, 28, 256);
      canvas.fillRect(171, 0, 28, 256);
      canvas.fillRect(228, 0, 28, 256);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(28, 0, 29, 256);
      canvas.fillRect(85, 0, 29, 256);
      canvas.fillRect(142, 0, 29, 256);
      canvas.fillRect(199, 0, 29, 256);
      break;
    case 10:
      canvas.setFillStyle(primary_division_colour);
      canvas.fillRect(0, 0, 256, 28);
      canvas.fillRect(0, 57, 256, 28);
      canvas.fillRect(0, 114, 256, 28);
      canvas.fillRect(0, 171, 256, 28);
      canvas.fillRect(0, 228, 256, 28);
      canvas.setFillStyle(secondary_division_colour);
      canvas.fillRect(0, 28, 256, 29);
      canvas.fillRect(0, 85, 256, 29);
      canvas.fillRect(0, 142, 256, 29);
      canvas.fillRect(0, 199, 256, 29);
      break;
    case 11:
      for (var i = 0; i < 7; i++) {
        for (var j = 0; j < 7; j++) {
          if ((i + j) % 2 == 0) {
            canvas.setFillStyle(primary_division_colour);
          } else {
            canvas.setFillStyle(secondary_division_colour);
          }
          canvas.fillRect(37 * (((i + 1) / 2) | 0) + 36 * ((i / 2) | 0), 37 * (((j + 1) / 2) | 0) + 36 * ((j / 2) | 0), 36 + ((i + 1) % 2), 36 + ((j + 1) % 2));
        }
      }
      break;
  }

  //Draw foreground and determine symbol position & size
  //0 = no overlay
  //1 = central cross
  //2 = off-center cross
  //3 = X
  //4 = diagonal band, top-left to bottom-right
  //5 = diagonal band, bottom-left to top-right
  //6 = central circle
  //7 = semicircle on left-edge
  //8 = triangle on left-edge
  //9 = central diamond
  //10 = top-left quarter
  //11 = central square
  var symbol_position_x = 0;
  var symbol_position_y = 0;
  var symbol_size = 256;
  canvas.setFillStyle(overlay_colour);
  switch (overlay) {
    case 0:
      symbol_position_x = 24;
      symbol_position_y = 24;
      symbol_size = 208;
      break;
    case 1:
      canvas.fillRect(104, 0, 48, 256);
      canvas.fillRect(0, 104, 256, 48);
      symbol_position_x = 24;
      symbol_position_y = 24;
      symbol_size = 208;
      break;
    case 2:
      canvas.fillRect(71, 0, 48, 256);
      canvas.fillRect(0, 104, 256, 48);
      symbol_position_x = 0;
      symbol_position_y = 33;
      symbol_size = 190;
      break;
    case 3:
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 34, y: 0 },
        { x: 256, y: 222 },
        { x: 256, y: 256 },
        { x: 222, y: 256 },
        { x: 0, y: 34 },
      ]);
      canvas.fillPolygon([
        { x: 256, y: 0 },
        { x: 256, y: 34 },
        { x: 34, y: 256 },
        { x: 0, y: 256 },
        { x: 0, y: 222 },
        { x: 222, y: 0 },
      ]);
      symbol_position_x = 24;
      symbol_position_y = 24;
      symbol_size = 208;
      break;
    case 4:
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 34, y: 0 },
        { x: 256, y: 222 },
        { x: 256, y: 256 },
        { x: 222, y: 256 },
        { x: 0, y: 34 },
      ]);
      symbol_position_x = 24;
      symbol_position_y = 24;
      symbol_size = 208;
      break;
    case 5:
      canvas.fillPolygon([
        { x: 256, y: 0 },
        { x: 256, y: 34 },
        { x: 34, y: 256 },
        { x: 0, y: 256 },
        { x: 0, y: 222 },
        { x: 222, y: 0 },
      ]);
      symbol_position_x = 24;
      symbol_position_y = 24;
      symbol_size = 208;
      break;
    case 6:
      canvas.fillCircle(128, 128, 100);
      symbol_position_x = 48;
      symbol_position_y = 48;
      symbol_size = 160;
      break;
    case 7:
      // Semicircle on left edge - approximate with polygon
      const points7 = [];
      for (let angle = -Math.PI / 2; angle <= Math.PI / 2; angle += SEMICIRCLE_ANGLE_STEP) {
        points7.push({
          x: 0 + 128 * Math.cos(angle),
          y: 128 + 128 * Math.sin(angle),
        });
      }
      canvas.fillPolygon(points7);
      symbol_position_x = 3;
      symbol_position_y = 73;
      symbol_size = 110;
      break;
    case 8:
      canvas.fillPolygon([
        { x: 0, y: 0 },
        { x: 196, y: 128 },
        { x: 0, y: 256 },
      ]);
      symbol_position_x = 8;
      symbol_position_y = 78;
      symbol_size = 100;
      break;
    case 9:
      canvas.fillPolygon([
        { x: 128, y: 0 },
        { x: 256, y: 128 },
        { x: 128, y: 256 },
        { x: 0, y: 128 },
      ]);
      symbol_position_x = 64;
      symbol_position_y = 64;
      symbol_size = 128;
      break;
    case 10:
      canvas.fillRect(0, 0, 128, 128);
      symbol_position_x = 2;
      symbol_position_y = 2;
      symbol_size = 124;
      break;
    case 11:
      canvas.fillRect(32, 32, 192, 192);
      symbol_position_x = 36;
      symbol_position_y = 36;
      symbol_size = 184;
      break;
  }

  //Draw symbol
  if (symbol != -1) {
    //Load symbol onto separate canvas
    const img = await loadImage(image_path);
    
    // Draw the symbol onto canvas2
    // We need to scale and position the loaded image
    const symbolData = img.data;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    // Scale and draw the symbol
    for (let y = 0; y < symbol_size; y++) {
      for (let x = 0; x < symbol_size; x++) {
        // Map from symbol position to source image position
        const srcX = Math.floor((x / symbol_size) * imgWidth);
        const srcY = Math.floor((y / symbol_size) * imgHeight);
        const srcIdx = (srcY * imgWidth + srcX) << 2;
        
        // Only copy if the pixel is not transparent
        if (symbolData[srcIdx + 3] > 0) {
          const destX = symbol_position_x + x;
          const destY = symbol_position_y + y;
          if (destX >= 0 && destX < CANVAS_WIDTH && destY >= 0 && destY < CANVAS_HEIGHT) {
            const destIdx = (destY * CANVAS_WIDTH + destX) << 2;
            canvas2.png.data[destIdx] = symbolData[srcIdx];
            canvas2.png.data[destIdx + 1] = symbolData[srcIdx + 1];
            canvas2.png.data[destIdx + 2] = symbolData[srcIdx + 2];
            canvas2.png.data[destIdx + 3] = symbolData[srcIdx + 3];
          }
        }
      }
    }
    
    //Merge the two canvases together
    const imageData1 = canvas.getImageData();
    const imageData2 = canvas2.getImageData();
    const data1 = imageData1.data;
    const data2 = imageData2.data;
    for (var i = 0; i < data1.length; i += 4) {
      if (data2[i + 3] != 0) {
        data1[i] = colour_palette[4][0];
        data1[i + 1] = colour_palette[4][1];
        data1[i + 2] = colour_palette[4][2];
        data1[i + 3] = 255;
      }
    }

    //Write canvas to png file
    canvas.putImageData(imageData1);
    let buffer = canvas.toBuffer();

    for (let output_path of output_paths) {
      fs.writeFileSync(output_path, buffer);
    }
  } else {
    //Don't bother with symbol and draw what we have to png file
    let buffer = canvas.toBuffer();

    for (let output_path of output_paths) {
      fs.writeFileSync(output_path, buffer);
    }
  }
}

async function generateFlags(output_path1, output_path2, input_path) {
  //Array of symbols that haven't been used yet
  var symbols = [];
  for (var i = 0; i < 39; i++) {
    symbols.push(i);
  }

  for (var i = 0; i < 39; i++) {
    var civName;
    //Symbol is an integer representing the flag symbol
    var symbol = symbols[getRandomInt(symbols.length)];
    var randInt = getRandomInt(4);
    if (randInt == 0 || symbols.length == 0) {
      //Chance of no symbol
      symbol = -1;
    } else {
      //Don't repeat symbols
      symbols.splice(symbols.indexOf(symbol), 1);
    }

    const nameArr = [
      "aztecs",
      "berber",
      "britons",
      "bulgarians",
      "burgundians",
      "burmese",
      "byzantines",
      "celts",
      "chinese",
      "cumans",
      "ethiopians",
      "franks",
      "goths",
      "huns",
      "inca",
      "indians",
      "italians",
      "japanese",
      "khmer",
      "koreans",
      "lithuanians",
      "magyars",
      "malay",
      "malians",
      "mayans",
      "mongols",
      "persians",
      "portuguese",
      "saracens",
      "sicilians",
      "slavs",
      "spanish",
      "tatars",
      "teutons",
      "turks",
      "vietnamese",
      "vikings",
      "poles",
      "bohemians",
    ];

    civName = nameArr[i];

    var seed = generateSeed();

    if (civName == "berber" || civName == "inca") {
      await drawFlag(
        seed,
        symbol,
        [
          output_path1 + "/" + civName + "s.png",
          output_path2 + "/menu_techtree_" + civName + ".png",
          output_path2 + "/menu_techtree_" + civName + "_hover.png",
          output_path2 + "/menu_techtree_" + civName + "_pressed.png",
        ],
        input_path
      );
    } else {
      await drawFlag(
        seed,
        symbol,
        [
          output_path1 + "/" + civName + ".png",
          output_path2 + "/menu_techtree_" + civName + ".png",
          output_path2 + "/menu_techtree_" + civName + "_hover.png",
          output_path2 + "/menu_techtree_" + civName + "_pressed.png",
        ],
        input_path
      );
    }
  }
}
