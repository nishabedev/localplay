#!/bin/bash

# LocalPlay Icon Generator
# Generates PNG icons from SVG for PWA

echo "🎨 Generating LocalPlay icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it:"
    echo "   Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "   macOS: brew install imagemagick"
    echo "   Windows: Download from https://imagemagick.org"
    exit 1
fi

# Generate icons
convert public/icons/icon.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon.svg -resize 512x512 public/icons/icon-512.png
convert public/icons/icon.svg -resize 180x180 public/icons/apple-touch-icon.png

echo "✅ Icons generated successfully!"
echo "   - icon-192.png"
echo "   - icon-512.png"
echo "   - apple-touch-icon.png"
