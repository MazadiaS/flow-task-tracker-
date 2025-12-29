// Script to create proper PWA icons with Flow branding
// Uses canvas to generate icons programmatically

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a Flow-branded icon
const createFlowIcon = (size) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background - gradient from dark to darker
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add "F" letter in the center
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', size / 2, size / 2);

  return canvas.toBuffer('image/png');
};

const publicDir = path.join(__dirname, '..', 'public');

try {
  // Create 192x192 icon
  fs.writeFileSync(
    path.join(publicDir, 'pwa-192x192.png'),
    createFlowIcon(192)
  );

  // Create 512x512 icon
  fs.writeFileSync(
    path.join(publicDir, 'pwa-512x512.png'),
    createFlowIcon(512)
  );

  console.log('✓ Flow PWA icons created successfully');
  console.log('  - pwa-192x192.png');
  console.log('  - pwa-512x512.png');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('canvas')) {
    console.log('⚠️  canvas module not found. Installing...');
    console.log('Run: npm install --save-dev canvas');
    console.log('Then run this script again.');
  } else {
    console.error('Error generating icons:', error);
  }
}
