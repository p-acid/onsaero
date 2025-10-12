# Extension Icons

This directory contains icons for the Chrome extension at various sizes.

## Required Sizes

- `icon16.png` - 16x16px - Used in the extension toolbar
- `icon48.png` - 48x48px - Used in the extension management page
- `icon128.png` - 128x128px - Used in the Chrome Web Store and installation

## Guidelines

- All icons should be PNG format
- Use transparent backgrounds for better integration
- Maintain consistent visual design across all sizes
- Optimize file sizes for production

## Generation

You can generate icons from a source SVG or high-resolution PNG using tools like:
- ImageMagick: `convert source.png -resize 16x16 icon16.png`
- Online tools: realfavicongenerator.net
- Design tools: Figma, Sketch, Adobe Illustrator
