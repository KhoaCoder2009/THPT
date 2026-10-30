# React Bits Backgrounds & Shaders Reference

React Bits contains **64 animated backgrounds and WebGL shaders**. These range from lightweight canvas/CSS effects to high-performance WebGL shaders powered by **OGL** and **Three.js**.

---

## 1. Background Families & Visual Categories

### A. Liquid & Metal Shaders
- **Balatro**: The signature swirling paint shader from the game Balatro, with pixelation, pointer stirring, and click whirlpools.
- **LiquidChrome**: Silky ribbons of liquid metal swirling through a dark pool, reflecting ambient lights and reacting to cursor velocity.
- **LiquidEther**: Churning fluid simulation whose color maps to local fluid speed.
- **MoltenMetal**: White-hot caustic filaments that heat up under the pointer and flare on clicks.
- **Ferrofluid**: Glossy sea of magnetic fluid spikes raising crowns near the cursor.

### B. Waves, Aurora & Organic Flow
- **Aurora / SoftAurora**: Calm aurora borealis flowing across the top or backdrop with 3D Perlin noise and cosine gradient color maps.
- **Silk**: Flowing satin folds with specular highlights and responsive ripples.
- **Plasma / PlasmaWave**: Twisting folds of luminous satin light with white-hot cores.
- **LineWaves / Waves**: Dense silky contour lines that part around the pointer and rebound with spring physics.
- **PatternWaves**: Halftone dots or glyphs draped over undulating waves.

### C. Cosmic, Particles & Space
- **Antigravity**: Particle field that lifts into a glowing gravity ring around the pointer and bursts on click.
- **Particles**: 3D particle constellation with twinkle, connecting lines, and cursor repel/attract modes.
- **Galaxy**: Endless starfield flight with warp jumps, star palettes, and pointer repulsion.
- **Hyperspeed**: Night highway light trails winding through 3D curves with hyperspace acceleration on hold.
- **Ballpit**: Soft-lit 3D balls in an enclosed container with real rigid-body collisions (`matter-js` / physics) you can toss, swipe, and blast.

### D. Cyberpunk, CRT & Retro
- **CRTWarp**: Blocky plasma rendered on a convex curved CRT monitor with scanlines, phosphor glow, curvature distortion, and power switch animation.
- **FaultyTerminal**: Flickering green/amber CRT matrix with phosphor trails and cursor glitching.
- **Dither**: Retro 1-bit / 2-bit dithered waves with Bayer matrices, halftone dots, and palette switching.
- **GradientASCII**: ASCII typography grid that samples living gradients and scrambles dynamically under the cursor.
- **LetterGlitch**: Matrix-style cascading characters flickering and glitching in RGB channels.

### E. Grid, Mesh & Topography
- **Topography**: 3D topographic terrain contour lines rising beneath the cursor like digital elevation models.
- **GridDistortion / GridMotion**: Tilted perspective grid planes with spring displacement and spotlight illumination.
- **DotGrid / DotField**: Springy grid of dots with interactive magnifying lens, pinch, or jelly shockwaves.
- **RippleGrid**: Water ripple displacement on a clean geometric grid.

### F. Volumetric Light & Lenses
- **LightRays / SideRays**: God-rays and volumetric shafts shining from any corner with atmospheric haze and cursor shadowing.
- **LightTunnel / Lightfall**: Fibre-optic wormholes and falling streaks of light stretching into warp speed.
- **LightPillar**: Swirling vortex pillar of intense light.
- **Prism / PrismaticBurst**: Rotating crystal prism dispersing white light into RGB spectrums.

---

## 2. Rendering Engines: OGL vs Three.js

React Bits selects the best tool for the job:

| Engine | When Used | Key Packages | Advantages |
| :--- | :--- | :--- | :--- |
| **OGL** | Pure 2D/3D fragment shaders, fullscreen effects | `ogl` | Minimal bundle size (<10KB vs 150KB+ for Three.js), high FPS, direct GLSL control |
| **Three.js** | 3D models, complex geometries, physics, cameras | `three`, `@react-three/fiber`, `@react-three/drei` | Full scene graph, materials, lighting, GLTF loaders |
| **2D Canvas** | Particle systems, generative curves, ASCII | Native `CanvasRenderingContext2D` | Zero dependencies, instant start, low memory |
| **Pure CSS/SVG**| Marquees, gradients, borders, simple loops | Native CSS / SVG | Zero JS execution during idle, battery friendly |

---

## 3. Production Best Practices & WebGL Lifecycle

When deploying React Bits shader backgrounds in React or Next.js applications, always enforce these principles:

### A. Next.js App Router `"use client"`
All interactive canvas and WebGL components interact directly with `window`, `document`, and GPU contexts. Always place `'use client';` at the very top of the component or its wrapper.

### B. Device Pixel Ratio (DPR) Clamping
High-DPI / Retina screens (DPR 3+) can kill GPU performance on full-screen shaders (rendering up to 16 million pixels at 60fps).
```javascript
// Recommended DPR capping in OGL / Three.js setup:
const dpr = Math.min(window.devicePixelRatio || 1, 2);
renderer.setSize(width * dpr, height * dpr);
gl.canvas.style.width = `${width}px`;
gl.canvas.style.height = `${height}px`;
```

### C. Clean Disposal on Component Unmount
Failing to destroy WebGL contexts causes memory leaks and eventually `WARNING: Too many active WebGL contexts. Oldest context will be lost`.

Always clean up in `useEffect`:
```javascript
useEffect(() => {
  let animationFrameId;
  const renderer = new Renderer({ ... });
  const gl = renderer.gl;

  const loop = () => {
    // render code...
    animationFrameId = requestAnimationFrame(loop);
  };
  animationFrameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('pointermove', handlePointer);
    
    // Dispose WebGL context
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (gl.canvas && gl.canvas.parentElement) {
      gl.canvas.parentElement.removeChild(gl.canvas);
    }
  };
}, []);
```

### D. Visibility Throttling (IntersectionObserver)
Pause the shader rendering loop when the background is scrolled out of view:
```javascript
useEffect(() => {
  let isVisible = true;
  const observer = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
  });
  if (containerRef.current) observer.observe(containerRef.current);

  const loop = () => {
    if (isVisible) {
      // render shader
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return () => observer.disconnect();
}, []);
```

### E. Accessibility: `prefers-reduced-motion`
Respect users who requested reduced motion by reducing speed to a very subtle drift or rendering a static fallback gradient:
```javascript
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const speed = prefersReduced ? 0.05 : 1.0;
```
