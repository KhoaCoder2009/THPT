# React Bits CLI & Implementation Recipes Reference

---

## 1. CLI Installation & Registries

### A. Automatic Registry Setup in `components.json`
If you use shadcn/ui, add `@react-bits` to your `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```

Once added, install components with simple aliases:
```bash
npx shadcn@latest add @react-bits/SplitText-TS-TW
```

### B. Direct URL Installation (No config needed)
You can directly run `shadcn` or `jsrepo` with the URL without modifying `components.json`:

```bash
# TypeScript + Tailwind (Recommended)
npx shadcn@latest add https://reactbits.dev/r/SplitText-TS-TW

# TypeScript + Plain CSS
npx shadcn@latest add https://reactbits.dev/r/SplitText-TS-CSS

# JavaScript + Tailwind
npx shadcn@latest add https://reactbits.dev/r/SplitText-JS-TW

# JavaScript + Plain CSS
npx shadcn@latest add https://reactbits.dev/r/SplitText-JS-CSS
```

With `jsrepo`:
```bash
npx jsrepo@latest add https://reactbits.dev/r/SplitText-TS-TW
```

---

## 2. Top Implementation Recipes

### Recipe 1: Hero Section with `SplitText` & `Aurora` Background

A landing page hero featuring a glowing aurora gradient and a staggered reveal headline:

```tsx
'use client';
import Aurora from '@/components/Backgrounds/Aurora/Aurora';
import SplitText from '@/components/TextAnimations/SplitText/SplitText';

export default function HeroSection() {
  return (
    <div className="relative w-full min-h-[600px] flex flex-col items-center justify-center overflow-hidden bg-zinc-950 text-white px-6">
      {/* 1. Background Shader */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <Aurora colorStops={['#3A29FF', '#FF94B4', '#FF3232']} speed={0.5} />
      </div>

      {/* 2. Hero Content */}
      <div className="relative z-10 max-w-4xl text-center flex flex-col items-center">
        <span className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-4 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
          Introducing KEdu Next
        </span>
        
        <SplitText
          text="Transform Your Learning with AI-Driven Precision"
          className="text-4xl md:text-6xl font-extrabold tracking-tight"
          delay={40}
          duration={0.8}
          effect="rise"
          tag="h1"
        />

        <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
          Elevate your exam preparation with personalized study paths, instant answer validation, and intelligent feedback.
        </p>

        <div className="mt-8 flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-medium hover:bg-zinc-200 transition">
            Get Started
          </button>
          <button className="px-6 py-3 rounded-xl bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition">
            Explore Demo
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Recipe 2: Feature Bento Grid with `SpotlightCard`

Interactive cards whose borders and surfaces illuminate near the pointer:

```tsx
'use client';
import SpotlightCard from '@/components/Components/SpotlightCard/SpotlightCard';

export function FeatureBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-zinc-950">
      <SpotlightCard
        className="custom-spotlight-card p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
        spotlightColor="rgba(99, 102, 241, 0.2)"
      >
        <h3 className="text-xl font-bold text-white mb-2">Automated Grading</h3>
        <p className="text-zinc-400 text-sm">
          Instant score calculation with deep explanation breakdown for all question formats.
        </p>
      </SpotlightCard>

      <SpotlightCard
        className="custom-spotlight-card p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
        spotlightColor="rgba(236, 72, 153, 0.2)"
      >
        <h3 className="text-xl font-bold text-white mb-2">Adaptive Difficulty</h3>
        <p className="text-zinc-400 text-sm">
          Dynamic question difficulty scales based on your accuracy and response latency.
        </p>
      </SpotlightCard>

      <SpotlightCard
        className="custom-spotlight-card p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl"
        spotlightColor="rgba(16, 185, 129, 0.2)"
      >
        <h3 className="text-xl font-bold text-white mb-2">Detailed Analytics</h3>
        <p className="text-zinc-400 text-sm">
          Track subject masteries, historical progression, and pinpoint weak topics.
        </p>
      </SpotlightCard>
    </div>
  );
}
```

---

### Recipe 3: Interactive Fluid Cursor with `SplashCursor`

Full-screen fluid simulation trailing cursor movements and dispersing on click:

```tsx
'use client';
import SplashCursor from '@/components/Animations/SplashCursor/SplashCursor';

export function LayoutWithFluidCursor({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Splash cursor sits fixed in the background */}
      <SplashCursor
        SIM_RESOLUTION={128}
        DYE_RESOLUTION={512}
        DENSITY_DISSIPATION={1}
        VELOCITY_DISSIPATION={0.2}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```
