# ColorCraft

**Build palettes that actually work.**

ColorCraft is a browser-based palette generator, contrast checker, UI preview tool, and color exporter for designers and developers.

## Features

### Palette studio
- Generate practical palettes with 3–8 colors
- Lock colors and regenerate only unlocked swatches
- Build a palette from a chosen base HEX color
- Reorder colors using accessible Left / Right controls
- Undo and redo the last 10 palette states
- Keyboard shortcuts for Generate, Lock, Copy, Undo, and Redo

### Color harmonies
- Random
- Complementary
- Analogous
- Triadic
- Split complementary
- Monochromatic
- Tetradic

Harmony generation uses centralized hue rotation plus controlled saturation and lightness rather than unconstrained random colors.

### Color inspector
- HEX
- RGB
- HSL
- Hue
- Saturation
- Lightness
- Relative luminance
- Approximate local color name
- Synchronized HEX / RGB / HSL editing
- One-click value copying

### Accessibility
- WCAG relative luminance calculations
- Contrast ratio
- AA normal text
- AAA normal text
- AA large text
- AAA large text
- Find readable palette pairs that meet AA normal-text contrast
- Suggest a stronger text color for UI previews

### UI preview
Assign palette colors to:
- Background
- Surface
- Primary
- Secondary
- Accent
- Text

Preview the palette in:
- Website
- Dashboard card
- Mobile app card

Auto Assign uses deterministic luminance and saturation heuristics.

### Saved palettes
Saved locally in the browser with no account required.

Each saved palette stores:
- ID
- Name
- Colors
- Harmony mode
- Creation date

You can rename, reopen, copy, delete, and export saved palettes.

### Import and export
Import 3–8 HEX colors separated by commas, spaces, semicolons, or new lines.

Export as:
- Plain HEX text
- CSS variables
- Tailwind-style color object
- JSON
- High-resolution 1600×900 PNG palette card

## Privacy

ColorCraft is frontend-only.

There is:
- no authentication
- no backend database
- no API key
- no analytics profile
- no payment system

Saved palettes and theme preferences stay in localStorage.

## Tech stack

- React 19
- TypeScript
- Vite
- Lucide React
- localStorage
- Clipboard API
- Canvas API
- Vitest

## Run locally

```bash
git clone https://github.com/jkeraso-cpu/colorcraft.git
cd colorcraft
npm install
npm run dev
```

Open the Vite URL shown in your terminal.

## Production build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

The test suite covers:
- HEX normalization and validation
- HEX ↔ RGB conversions
- RGB ↔ HSL round-tripping
- standard harmony offsets
- requested harmony palette sizes
- WCAG contrast, including black/white ≈ 21:1
- WCAG rating thresholds
- palette import parsing
- deterministic UI-role assignment
- filename sanitization
- saved-palette persistence
- theme persistence

## Project structure

```text
src/
  App.tsx             Main ColorCraft V1 application
  Swatch.tsx          Reusable tactile color swatch
  colorMath.ts        Color conversions, luminance, WCAG, readable text
  harmony.ts          Palette generation and harmony math
  paletteUtils.ts     Imports, role heuristics, names, filenames
  paletteExport.ts    Text, file, and PNG exports
  storage.ts          localStorage persistence
  styles.css          Responsive light/dark visual system
  *.spec.ts           Utility and persistence tests
```

## Deployment

ColorCraft is a static frontend application and can be deployed to services such as GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

No runtime secrets are required.

## Future improvements

Ideas reserved for Version 2:
- Shareable palette URLs
- Drag-and-drop swatch reordering
- Tints and Shades generators
- Advanced contrast matrix
- Gradient Lab
- Better saved-palette organization
- Role locking

## License

MIT
