# React Bits Animation Engines & Tech Stack Reference

React Bits relies on purpose-built animation engines rather than forcing a one-size-fits-all approach. Below is the reference architecture for each engine.

---

## 1. Motion (formerly Framer Motion)

Used for declarative React animation, layout morphing, spring physics, and text sequence transitions.

### Key Packages
```bash
npm install motion
# or for legacy projects:
npm install framer-motion
```

### Components Powered by Motion
- **Text Animations**: `BlurText`, `CircularText`, `CountUp`, `DecryptedText`, `RotatingText`, `ScrollVelocity`, `TrueFocus`
- **Interactive UI**: `Stack`, `AnimatedList`, `StaggeredMenu`, `Stepper`, `InfiniteMenu`
- **Micro Interactions**: `SquishSwitch`, `SpringCheck`, `JellyRadio`, `RubberSegment`, `FlipCard`

### Typical Pattern
```tsx
'use client';
import { motion, AnimatePresence } from 'motion/react';

export const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);
```

---

## 2. GSAP & ScrollTrigger

Used for high-precision text manipulation, character splitting, scroll-linked scrubbed animations, and complex multi-stage timelines.

### Key Packages
```bash
npm install gsap @gsap/react
```

### Components Powered by GSAP
- **Advanced Text**: `SplitText`, `FoldText`, `MaskedHeading`, `ScrambledText`, `ScrollFloat`, `ScrollReveal`, `Shuffle`, `StrokeText`, `TextLoop`, `TextType`
- **Motion Effects**: `AnimatedContent`, `FadeContent`, `ScrollStack`, `AccordionGallery`, `CardSwap`

### Safe React Lifecycle with `useGSAP`
Never use plain `useEffect` without cleanups for GSAP. Always use `@gsap/react`:
```tsx
'use client';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export const RevealSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.box', {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true
        }
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <div className="box">Item 1</div>
      <div className="box">Item 2</div>
    </div>
  );
};
```

---

## 3. Matter.js (2D Rigid-Body Physics)

Used for playful physical simulations where UI elements or text characters tumble, collide, and react to pointer drag, toss, and gravity.

### Key Packages
```bash
npm install matter-js
# Types (optional)
npm install -D @types/matter-js
```

### Components Powered by Matter.js
- `FallingText`: Characters split into individual rigid rectangles that drop under gravity into a pile at the container base. You can drag letters with mouse constraint and swipe them away.
- `Ballpit`: Soft-lit physics spheres that bounce inside a 3D or 2D enclosure.

---

## 4. OGL (Minimal WebGL) vs Three.js

### OGL (`npm install ogl`)
- **Bundle**: ~10KB (compared to 150KB+ for Three.js).
- **Ideal for**: Fullscreen 2D/3D shaders, fragment noise, fluid physics.
- **Used by**: `LiquidChrome`, `Aurora`, `Balatro`, `WarpText`, `FluidGlass`, `GradientASCII`, `LetterGlitch`, `Dither`.

### Three.js (`npm install three @react-three/fiber @react-three/drei`)
- **Ideal for**: True 3D meshes, lighting, glTF 3D models, shadows.
- **Used by**: `ModelViewer`, `Lanyard`, `DomeGallery`, `Cubes`, `CircularCarousel`.

---

## 5. Web Audio Sound Engine

React Bits includes an embedded Web Audio sound engine that synthesizes 200 interactive UI sounds procedurally without requiring audio assets (no `.mp3` or `.wav` files to download).

### Sound Categories
- **Clicks & Taps**: Subtle micro-feedback for buttons, toggles, and switches.
- **Swooshes & Swipes**: Spatial audio for slide commits, carousels, and card fling.
- **Bells & Chimes**: Confirmation sounds, success indicators, and alerts.
- **Error & Buzzers**: Reject, invalid form, and shake sounds.

### Usage Pattern
```tsx
import { useSound } from '@/components/sounds/react-bits-sound';

export const InteractiveButton = () => {
  const { play } = useSound('click-crisp');

  return (
    <button onClick={() => play()}>
      Click Me
    </button>
  );
};
```
