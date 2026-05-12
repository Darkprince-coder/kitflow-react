#!/usr/bin/env node
// Run: node generate-icons.js
// Requires: npm install sharp (run once, not added to main deps)
// Generates PNG icons at all required PWA sizes from public/icons/icon.svg

const fs   = require('fs')
const path = require('path')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const SVG_PATH = path.join(__dirname, 'public/icons/icon.svg')
const OUT_DIR  = path.join(__dirname, 'public/icons')

async function generate() {
  let sharp
  try {
    sharp = require('sharp')
  } catch {
    console.log('Installing sharp...')
    require('child_process').execSync('npm install sharp --no-save', { stdio: 'inherit' })
    sharp = require('sharp')
  }

  const svg = fs.readFileSync(SVG_PATH)

  for (const size of SIZES) {
    const out = path.join(OUT_DIR, `icon-${size}.png`)
    await sharp(svg).resize(size, size).png().toFile(out)
    console.log(`✓ icon-${size}.png`)
  }

  // Update manifest.json with all sizes
  const manifestPath = path.join(__dirname, 'public/manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.icons = [
    { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ...SIZES.map(s => ({
      src:     `/icons/icon-${s}.png`,
      sizes:   `${s}x${s}`,
      type:    'image/png',
      purpose: s >= 192 ? 'any maskable' : 'any',
    }))
  ]
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log('✓ manifest.json updated')
  console.log('\nDone! Commit the public/icons/ folder.')
}

generate().catch(console.error)
