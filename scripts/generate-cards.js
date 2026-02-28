#!/usr/bin/env node
'use strict';

/**
 * generate-cards.js
 *
 * Generates 256×256 PNG card images from scripts/boni-card-specs.json.
 * Output goes to public/img/cards/{type}_{id}.png.
 *
 * Layout:
 *   - Background: cards/card_background.png (includes the border frame)
 *   - 1–3 main icons (unit/building type) in the upper portion
 *     - 1 icon: centered
 *     - 2 icons: side by side
 *     - 3 icons: triangle (2 back-faded + 1 front)
 *   - Stat modifier strip at the bottom (y=166–230):
 *     - modifier symbol (plus/minus/free) drawn programmatically
 *     - stat icons from staticons/
 *     - when all modifiers are the same type, one modifier icon precedes all stat icons
 *   (card_border.png is NOT used; the ornate border is baked into card_background.png)
 *
 * Usage: node scripts/generate-cards.js [--spec <path>]
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const CARD_SIZE = 256;
const REPO_ROOT = path.join(__dirname, '..');
const IMG_DIR = path.join(REPO_ROOT, 'public', 'img');
const CARDS_DIR = path.join(IMG_DIR, 'cards');

const CARD_TYPES = ['bonus', 'castle', 'imp', 'team'];

// Pixels whose max(R,G,B) is at or below this value are treated as pure-black
// background and made fully transparent during unit-icon loading.
// Value of 25 captures antialiased edge pixels (dark halos) while preserving
// genuine dark unit-art pixels that exceed this brightness.
const BLACK_THRESHOLD = 25;

// ── image primitives ──────────────────────────────────────────────────────────

function loadPng(relPath) {
  const fullPath = path.join(IMG_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  Warning: image not found: ${relPath}, using blank`);
    return createBlank(64, 64);
  }
  return PNG.sync.read(fs.readFileSync(fullPath));
}

/**
 * Load a unit/building icon and strip its black background.
 * Game assets are often stored as RGB PNGs (no alpha channel) or as RGBA PNGs
 * where the alpha channel is unused (all pixels fully opaque) and black is
 * used as the background colour.  In both cases we convert black → transparent
 * so icons composite cleanly over the card background.
 *
 * alpha = max(r, g, b) — pure black → α=0, bright pixels → α=255.
 * RGB channels are normalised to avoid premultiplied-alpha darkening.
 */
function loadUnitIcon(relPath) {
  const png = loadPng(relPath);
  // Detect black-background images: no alpha channel, OR alpha channel present
  // but no pixel is actually transparent (all alpha=255, black used as bg colour).
  if (png.alpha) {
    // Only scan if the PNG header claims an alpha channel; skip if it doesn't.
    let hasTransparentPixel = false;
    for (let i = 3; i < png.data.length; i += 4) {
      if (png.data[i] < 255) { hasTransparentPixel = true; break; }
    }
    if (hasTransparentPixel) return png;
  }
  // Apply hard threshold: pure-black background pixels (max(r,g,b) ≤ BLACK_THRESHOLD)
  // become fully transparent; all other pixels stay fully opaque.  This preserves dark
  // unit art (shadow, armour) that a soft luminance-alpha would make semi-transparent.
  for (let i = 0; i < png.width * png.height; i++) {
    const base = i << 2;
    const maxRGB = Math.max(png.data[base], png.data[base + 1], png.data[base + 2]);
    png.data[base + 3] = maxRGB <= BLACK_THRESHOLD ? 0 : 255;
  }
  png.alpha = true;
  return png;
}

function createBlank(width, height) {
  const png = new PNG({ width, height });
  png.data = Buffer.alloc(width * height * 4, 0);
  return png;
}

/** Nearest-neighbour scale */
function scaleNearest(src, w, h) {
  const dst = createBlank(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(Math.floor((x * src.width) / w), src.width - 1);
      const sy = Math.min(Math.floor((y * src.height) / h), src.height - 1);
      const si = (src.width * sy + sx) << 2;
      const di = (w * y + x) << 2;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  return dst;
}

/** Porter-Duff "over" compositing with optional global alpha */
function alphaBlend(base, overlay, destX, destY, globalAlpha = 1.0) {
  for (let y = 0; y < overlay.height; y++) {
    const by = destY + y;
    if (by < 0 || by >= base.height) continue;
    for (let x = 0; x < overlay.width; x++) {
      const bx = destX + x;
      if (bx < 0 || bx >= base.width) continue;
      const si = (overlay.width * y + x) << 2;
      const di = (base.width * by + bx) << 2;
      const srcA = (overlay.data[si + 3] / 255) * globalAlpha;
      if (srcA === 0) continue;
      const dstA = base.data[di + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      if (outA === 0) continue;
      base.data[di] = Math.round(
        (overlay.data[si] * srcA + base.data[di] * dstA * (1 - srcA)) / outA
      );
      base.data[di + 1] = Math.round(
        (overlay.data[si + 1] * srcA + base.data[di + 1] * dstA * (1 - srcA)) / outA
      );
      base.data[di + 2] = Math.round(
        (overlay.data[si + 2] * srcA + base.data[di + 2] * dstA * (1 - srcA)) / outA
      );
      base.data[di + 3] = Math.round(outA * 255);
    }
  }
}

function fillRect(png, x, y, w, h, r, g, b, a = 255) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(png.width, x + w);
  const y1 = Math.min(png.height, y + h);
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const i = (png.width * py + px) << 2;
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = a;
    }
  }
}

function drawLine(png, x0, y0, x1, y1, r, g, b, a = 255) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const steps = Math.max(dx, dy, 1);
  for (let t = 0; t <= steps; t++) {
    const px = Math.round(x0 + (x1 - x0) * t / steps);
    const py = Math.round(y0 + (y1 - y0) * t / steps);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const nx = px + ox;
        const ny = py + oy;
        if (nx >= 0 && nx < png.width && ny >= 0 && ny < png.height) {
          const i = (png.width * ny + nx) << 2;
          png.data[i] = r;
          png.data[i + 1] = g;
          png.data[i + 2] = b;
          png.data[i + 3] = a;
        }
      }
    }
  }
}

function drawCircleOutline(png, cx, cy, radius, r, g, b, a = 255) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= radius - 1.5 && d <= radius + 0.5) {
        const px = cx + dx;
        const py = cy + dy;
        if (px >= 0 && px < png.width && py >= 0 && py < png.height) {
          const i = (png.width * py + px) << 2;
          png.data[i] = r;
          png.data[i + 1] = g;
          png.data[i + 2] = b;
          png.data[i + 3] = a;
        }
      }
    }
  }
}

// ── modifier symbol icons ─────────────────────────────────────────────────────

/**
 * Creates a 36×36 PNG icon for a stat modifier type.
 *   plus     – green plus sign
 *   minus    – red minus sign
 *   free     – red forbidden sign (🚫, zero cost)
 *   multiply – yellow × sign
 *   faster   – three right-pointing green chevrons (speed increase)
 *   instant  – white stopwatch face with hand at 12 o'clock (no research time)
 */
function makeModifierIcon(type) {
  const S = 36;
  const png = createBlank(S, S);
  const mid = S / 2;
  const barLen = 22;
  const barThick = 6;
  const bx = Math.floor((S - barLen) / 2); // 7
  const by = Math.floor((S - barThick) / 2); // 15

  switch (type) {
    case 'plus':
      fillRect(png, bx, by, barLen, barThick, 60, 200, 60, 255); // horizontal
      fillRect(png, by, bx, barThick, barLen, 60, 200, 60, 255); // vertical
      break;

    case 'minus':
      fillRect(png, bx, by, barLen, barThick, 220, 60, 60, 255);
      break;

    case 'free': {
      // Forbidden / "no-cost" sign: red circle with diagonal slash (🚫)
      const DIAG = 0.7071; // cos(45°) = sin(45°) = √2/2 — direction of 45° diagonal
      const SLASH_HALF_WIDTH = 3; // half stroke width for the slash line in pixels
      const circR = mid - 3;
      drawCircleOutline(png, mid, mid, circR, 220, 60, 60, 255);
      // Slash from upper-left to lower-right: parametric along 45° direction
      for (let t = -circR; t <= circR; t++) {
        for (let w = -SLASH_HALF_WIDTH; w <= SLASH_HALF_WIDTH; w++) {
          const px = Math.round(mid + (t - w) * DIAG);
          const py = Math.round(mid + (t + w) * DIAG);
          if (px >= 0 && px < S && py >= 0 && py < S) {
            const idx = (S * py + px) << 2;
            png.data[idx] = 220;
            png.data[idx + 1] = 60;
            png.data[idx + 2] = 60;
            png.data[idx + 3] = 255;
          }
        }
      }
      break;
    }

    case 'multiply':
      fillRect(png, bx, by, barLen, barThick, 220, 200, 60, 255); // horizontal
      fillRect(png, by, bx, barThick, barLen, 220, 200, 60, 255); // vertical
      break;

    case 'faster': {
      // Three right-pointing green chevrons: >>> (speed / faster)
      const H = 7; // half-height of each chevron arm
      const tipXs = [11, 20, 29]; // tip x-coordinates for 3 chevrons
      for (const tipX of tipXs) {
        drawLine(png, tipX - H, mid - H, tipX, mid, 60, 200, 60, 255); // upper arm
        drawLine(png, tipX - H, mid + H, tipX, mid, 60, 200, 60, 255); // lower arm
      }
      break;
    }

    case 'instant': {
      // Stopwatch: circular face + hand at 12 o'clock (= instant / no research time)
      const circR = mid - 3;
      drawCircleOutline(png, mid, mid, circR, 230, 230, 230, 255);
      // Hand pointing straight up (12 o'clock)
      drawLine(png, mid, mid, mid, mid - circR + 2, 230, 230, 230, 255);
      // Center dot
      fillRect(png, mid - 1, mid - 1, 3, 3, 230, 230, 230, 255);
      // Crown / button at the top
      fillRect(png, mid - 2, 0, 5, 3, 230, 230, 230, 255);
      break;
    }

    default:
      fillRect(png, bx, by, barLen, barThick, 150, 150, 150, 255);
  }
  return png;
}

// ── layout helpers ────────────────────────────────────────────────────────────

/**
 * Place 1–3 main icons in the upper portion of the card (y ≈ 15–165).
 *   1 icon  – centered
 *   2 icons – side by side
 *   3 icons – triangle: two back-faded icons + one front icon
 */
function placeMainIcons(canvas, iconPaths) {
  if (iconPaths.length === 0) return;
  const paths = iconPaths.slice(0, 3);

  if (paths.length === 1) {
    const size = 130;
    const x = Math.floor((CARD_SIZE - size) / 2);
    const icon = scaleNearest(loadUnitIcon(paths[0]), size, size);
    alphaBlend(canvas, icon, x, 18);
  } else if (paths.length === 2) {
    const size = 105;
    const gap = 16;
    const startX = Math.floor((CARD_SIZE - size * 2 - gap) / 2);
    alphaBlend(canvas, scaleNearest(loadUnitIcon(paths[0]), size, size), startX, 25);
    alphaBlend(canvas, scaleNearest(loadUnitIcon(paths[1]), size, size), startX + size + gap, 25);
  } else {
    // Triangle: back-left and back-right (slightly faded), front centered lower
    const backSize = 95;
    const frontSize = 105;
    const backAlpha = 0.72;
    alphaBlend(canvas, scaleNearest(loadUnitIcon(paths[0]), backSize, backSize), 15, 15, backAlpha);
    alphaBlend(
      canvas,
      scaleNearest(loadUnitIcon(paths[1]), backSize, backSize),
      CARD_SIZE - 15 - backSize,
      15,
      backAlpha
    );
    const frontX = Math.floor((CARD_SIZE - frontSize) / 2);
    alphaBlend(canvas, scaleNearest(loadUnitIcon(paths[2]), frontSize, frontSize), frontX, 55);
  }
}

/**
 * Place stat-modifier icons in the bottom strip.
 * Bottom edge is y=166+64=230, flush with the inner border of card_background.png.
 *
 * When all entries share the same modifier, renders:
 *   [mod_icon] [stat_icon] [stat_icon] …
 * Otherwise renders pairs:
 *   [mod_icon] [stat_icon] [mod_icon] [stat_icon] …
 *
 * The modifier icon uses a tight gap (MOD_GAP) before its stat icon so the
 * indicator sits visually attached to the value it modifies.
 */
function placeStatModifiers(canvas, statModifiers) {
  if (statModifiers.length === 0) return;

  const ICON_SIZE = 64;
  const GAP = 8;     // gap between stat icons / between pairs
  const MOD_GAP = 2; // tight gap between a modifier icon and its stat icon

  const allSame =
    statModifiers.length > 1 &&
    statModifiers.every((m) => m.modifier === statModifiers[0].modifier);

  const items = [];
  if (allSame) {
    items.push({ kind: 'mod', modifier: statModifiers[0].modifier });
    for (const sm of statModifiers) items.push({ kind: 'stat', stat: sm.stat });
  } else {
    for (const sm of statModifiers) {
      items.push({ kind: 'mod', modifier: sm.modifier });
      items.push({ kind: 'stat', stat: sm.stat });
    }
  }

  // Total width with variable gaps (mod→stat tight, everything else normal)
  let totalW = items.length * ICON_SIZE;
  for (let i = 0; i < items.length - 1; i++) {
    totalW += items[i].kind === 'mod' ? MOD_GAP : GAP;
  }

  let x = Math.floor((CARD_SIZE - totalW) / 2);
  const y = 166; // bottom edge = 166 + 64 = 230, flush with inner border

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let icon;
    if (item.kind === 'mod') {
      icon = scaleNearest(makeModifierIcon(item.modifier), ICON_SIZE, ICON_SIZE);
    } else {
      icon = scaleNearest(loadPng(`staticons/${item.stat}.png`), ICON_SIZE, ICON_SIZE);
    }
    alphaBlend(canvas, icon, x, y);
    if (i < items.length - 1) {
      x += ICON_SIZE + (items[i].kind === 'mod' ? MOD_GAP : GAP);
    }
  }
}

// ── card generation ───────────────────────────────────────────────────────────

function generateCard(spec) {
  const canvas = createBlank(CARD_SIZE, CARD_SIZE);

  // 1. Background
  const bg = scaleNearest(loadPng('cards/card_background.png'), CARD_SIZE, CARD_SIZE);
  alphaBlend(canvas, bg, 0, 0);

  // 2. Main icons
  placeMainIcons(canvas, spec.mainIcons || []);

  // 3. Stat modifiers
  placeStatModifiers(canvas, spec.statModifiers || []);

  return canvas;
}

// ── main ──────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const specIdx = args.indexOf('--spec');
  const specPath =
    specIdx !== -1
      ? path.resolve(args[specIdx + 1])
      : path.join(__dirname, 'boni-card-specs.json');

  if (!fs.existsSync(specPath)) {
    console.error(`Spec file not found: ${specPath}`);
    process.exit(1);
  }

  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  let generated = 0;

  for (const cardType of CARD_TYPES) {
    if (!spec[cardType]) continue;

    const group = spec[cardType];
    const cards = group.cards || [];
    let nextId = group.startId ?? 0;

    for (const cardSpec of cards) {
      const id = cardSpec.id ?? nextId;
      nextId = id + 1;

      console.log(`  ${cardType}_${id}.png  –  ${cardSpec.label || '(no label)'}`);
      const card = generateCard(cardSpec);
      const outPath = path.join(CARDS_DIR, `${cardType}_${id}.png`);
      fs.writeFileSync(outPath, PNG.sync.write(card));
      generated++;
    }
  }

  console.log(`\nGenerated ${generated} card(s) → ${CARDS_DIR}`);
}

main();
