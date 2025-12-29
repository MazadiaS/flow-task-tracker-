#!/bin/bash

# Create simple SVG icons and convert to PNG using ImageMagick (if available)
# If ImageMagick is not available, we'll create basic HTML/Canvas fallback

# Create SVG template
cat > /Users/muje/track/task-tracker/public/icon-template.svg << 'SVGEOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="64"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="320" font-weight="bold" fill="white" text-anchor="middle">F</text>
</svg>
SVGEOF

echo "SVG icon created at public/icon-template.svg"
echo "To convert to PNG, you can:"
echo "1. Use an online converter like https://cloudconvert.com/svg-to-png"
echo "2. Or use ImageMagick: convert -background none icon-template.svg -resize 512x512 pwa-512x512.png"
echo "3. Then resize: convert pwa-512x512.png -resize 192x192 pwa-192x192.png"
