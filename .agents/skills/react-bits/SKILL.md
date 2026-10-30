---
name: react-bits
description: "Animated, interactive, and customizable React components library from React Bits (DavidHDev/react-bits). Includes 218+ components across 5 categories: Text Animations (SplitText, BlurText, TrueFocus, DecryptedText), Animations & Cursors (BlobCursor, SplashCursor, ClickSpark, ElectricBorder), UI Components (SpotlightCard, TiltedCard, Dock, MagicBento, CircularGallery), Micro-Interactions (SquishSwitch, SpringCheck, HoldButton, VoicePill), and Backgrounds/Shaders (Aurora, Balatro, LiquidChrome, Particles, Hyperspeed, Antigravity). Supports 4 variants (JS/TS with CSS/Tailwind) installable via shadcn and jsrepo CLI."
argument-hint: "[component name, effect, or category]"
license: MIT
metadata:
  author: David Haz / React Bits
  version: "1.0.0"
---

# React Bits Skill

Comprehensive guide and implementation engine for **React Bits** (`https://reactbits.dev` by David Haz) — a library of **218+ copy-paste animated React components, WebGL shaders, text reveals, and micro-interactions**.

---

## 1. When to Use This Skill

Activate this skill whenever:
- Creating or enhancing modern, interactive React/Next.js interfaces.
- The user asks for **animated headlines, text reveals, typewriters, or scrambled glyphs** (e.g., `SplitText`, `BlurText`, `DecryptedText`).
- Adding **interactive cursors, magnetic physics, spark effects, or peeling stickers** (e.g., `SplashCursor`, `BlobCursor`, `Magnet`, `ClickSpark`).
- Building **interactive cards, 3D tilt, bento grids, carousels, or floating docks** (e.g., `SpotlightCard`, `TiltedCard`, `Dock`, `MagicBento`).
- Implementing **rich shader backgrounds, WebGL fluids, glowing auroras, or cyberpunk starfields** (e.g., `LiquidChrome`, `Aurora`, `Balatro`, `Particles`, `Antigravity`).
- Polishing **tactile micro-interactions, animated switches, confirmation buttons, or voice pills** (e.g., `SquishSwitch`, `HoldButton`, `VoicePill`).

---

## 2. Component Taxonomy & Decision Matrix

React Bits organizes 218 components into 5 distinct semantic categories:

| Category | Count | Primary Focus | Flagship Components |
| :--- | :---: | :--- | :--- |
| **Text Animations** | 33 | Headlines, intros, dynamic typography, scroll-linked text | `SplitText`, `BlurText`, `TrueFocus`, `DecryptedText`, `ShinyText`, `VariableProximity`, `FallingText` |
| **Animations & Effects** | 38 | Cursor followers, hover warps, electrical borders, particle trails | `BlobCursor`, `SplashCursor`, `ClickSpark`, `ElectricBorder`, `Magnet`, `LaserFlow`, `MetallicPaint` |
| **Components & Layouts** | 48 | Cards, navigation bars, docks, 3D galleries, bento grids | `SpotlightCard`, `TiltedCard`, `Dock`, `MagicBento`, `CircularGallery`, `FluidGlass`, `InfiniteMenu` |
| **Micro Interactions** | 35 | Tactile inputs, springy toggles, rating stars, hold buttons | `SquishSwitch`, `SpringCheck`, `HoldButton`, `VoicePill`, `PulseHeart`, `CometDial`, `SwipeRow` |
| **Backgrounds & Shaders** | 64 | Fullscreen ambient backdrops, WebGL shaders, cosmic fields | `Aurora`, `Balatro`, `LiquidChrome`, `Particles`, `Hyperspeed`, `Antigravity`, `Topography`, `Dither` |

### Quick Selection Guide

- **Hero Headline Entrance**: Use `SplitText` (for staggered character rises) or `BlurText` (for elegant soft focus resolve).
- **Hacker / Tech Wordmark**: Use `DecryptedText` (scrambling letters) or `TechText` (dashed vector paths).
- **Interactive Card Grid**: Use `SpotlightCard` (subtle radial light following cursor) or `MagicBento` (edge-lit bento boxes).
- **Atmospheric Dark Backdrop**: Use `Aurora` (calm floating gradient), `LiquidChrome` (reflective fluid pool), or `Hyperspeed` (light trail highway).
- **Playful Feedback**: Use `ClickSpark` (burst of stars/dashes on click) or `Magnet` (elements ease toward the cursor).
- **Physical Collision Effect**: Use `FallingText` or `Ballpit` (Matter.js rigid-body physics).

---

## 3. Four Flavors & CLI Installation

Every component comes in **4 identical variants**:
1. `TS-TW`: TypeScript + Tailwind CSS *(Recommended)*
2. `TS-CSS`: TypeScript + Plain CSS
3. `JS-TW`: JavaScript + Tailwind CSS
4. `JS-CSS`: JavaScript + Plain CSS

### A. shadcn CLI (Direct URL)
```bash
# Suffix format: <Component>-<LANG>-<STYLE>
npx shadcn@latest add https://reactbits.dev/r/SplitText-TS-TW
npx shadcn@latest add https://reactbits.dev/r/SpotlightCard-TS-TW
npx shadcn@latest add https://reactbits.dev/r/Aurora-TS-TW
```

### B. jsrepo CLI
```bash
npx jsrepo@latest add https://reactbits.dev/r/SplitText-TS-TW
```

### C. Agent / Project Registry (`components.json`)
Add the `@react-bits` registry to your `components.json`:
```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```
Then install components simply by name:
```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW
```

---

## 4. Key Animation Engines & Dependencies

React Bits components rely on focused, modern animation engines:

| Engine | Command to Install | Primary Use Cases in React Bits |
| :--- | :--- | :--- |
| **Motion** (Framer) | `npm i motion` | Text reveals (`BlurText`, `TrueFocus`, `DecryptedText`), micro-interactions, layout transitions |
| **GSAP** + Plugin | `npm i gsap @gsap/react` | Complex split-text typography (`SplitText`, `FoldText`, `Shuffle`), scroll-triggered sequences |
| **OGL** | `npm i ogl` | Lightweight (<10KB) WebGL fragment shaders (`LiquidChrome`, `Aurora`, `Balatro`, `WarpText`) |
| **Three.js** | `npm i three @react-three/fiber @react-three/drei` | Full 3D scenes, meshes, and glTF models (`ModelViewer`, `Lanyard`, `DomeGallery`) |
| **Matter.js** | `npm i matter-js` | 2D rigid-body collision & drag physics (`FallingText`, `Ballpit`) |

---

## 5. Next.js App Router & Performance Rules

1. **Always add `'use client';`**: WebGL, Canvas, GSAP, and cursor listeners require DOM and window access.
2. **Cap DPR for Fullscreen Shaders**: Clamp `window.devicePixelRatio` to `Math.min(window.devicePixelRatio || 1, 2)` to protect 4K screens from frame drops.
3. **Cancel Animation Frames & Clean Up WebGL**: Always call `cancelAnimationFrame` and `gl.getExtension('WEBGL_lose_context')?.loseContext()` inside `useEffect` unmount cleanup.
4. **Pause Inactive Animations**: Use `IntersectionObserver` to pause render loops when the component is off-screen.
5. **Respect `prefers-reduced-motion`**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')` to disable heavy warps or provide subtle fallbacks.

---

## 6. Helper Tools & References

- **Full Component Catalog**: [components-catalog.md](./references/components-catalog.md) — complete lookup table of all 218 components with descriptions, dependencies, and docs.
- **Backgrounds & Shaders Guide**: [backgrounds-and-shaders.md](./references/backgrounds-and-shaders.md) — deep dive into WebGL/OGL/Three.js shaders and performance.
- **Animation Engines Reference**: [animation-engines.md](./references/animation-engines.md) — best practices for Motion, GSAP, and Web Audio.
- **Recipes & Snippets**: [cli-and-recipes.md](./references/cli-and-recipes.md) — practical examples for heroes, bento cards, and interactive layouts.

### Fast Local Search Script
Search components locally via node:
```bash
# Search by keyword
node .agents/skills/react-bits/scripts/search.cjs --query aurora

# Filter by category
node .agents/skills/react-bits/scripts/search.cjs --category text

# Filter by engine
node .agents/skills/react-bits/scripts/search.cjs --engine ogl

# Get full metadata & CLI command for a component
node .agents/skills/react-bits/scripts/search.cjs --info SplitText
```
