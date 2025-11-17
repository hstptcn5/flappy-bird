/**
 * Script to copy images for Farcaster manifest
 * Run this after deploying to ensure all required images exist
 * 
 * Usage: node scripts/setup-images.js
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Images to copy/create
const imageMappings = [
  {
    source: '1.png',
    target: 'splash-image.png',
    description: 'Splash screen image'
  },
  {
    source: '1.png',
    target: 'og-image.png',
    description: 'OG image for social sharing'
  },
  {
    source: '2.png',
    target: 'screenshot-1.png',
    description: 'Screenshot 1'
  },
  {
    source: '3.png',
    target: 'screenshot-2.png',
    description: 'Screenshot 2'
  },
  {
    source: '4.png',
    target: 'screenshot-3.png',
    description: 'Screenshot 3'
  }
];

function setupImages() {
  console.log('🖼️  Setting up Farcaster manifest images...\n');

  let copied = 0;
  let skipped = 0;

  imageMappings.forEach(({ source, target, description }) => {
    const sourcePath = path.join(publicDir, source);
    const targetPath = path.join(publicDir, target);

    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      console.log(`❌ Source not found: ${source} (for ${target})`);
      return;
    }

    // Check if target already exists
    if (fs.existsSync(targetPath)) {
      console.log(`⏭️  Skipped: ${target} (already exists)`);
      skipped++;
      return;
    }

    try {
      // Copy file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Created: ${target} (from ${source}) - ${description}`);
      copied++;
    } catch (error) {
      console.error(`❌ Failed to copy ${source} to ${target}:`, error.message);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Copied: ${copied}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📁 Total required: ${imageMappings.length}`);
  
  if (copied > 0) {
    console.log(`\n✨ Done! Images are ready for Farcaster manifest.`);
    console.log(`   Deploy these changes and test at: /api/debug/manifest`);
  } else {
    console.log(`\n✨ All images already exist!`);
  }
}

// Run the script
try {
  setupImages();
} catch (error) {
  console.error('❌ Error setting up images:', error);
  process.exit(1);
}

