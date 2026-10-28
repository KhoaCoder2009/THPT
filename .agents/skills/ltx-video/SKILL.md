---
name: ltx-video
description: "Generative AI Video & Audio Foundation Model (Lightricks LTX-2 / LTX-Video). Generates cinematic high-definition video with synchronized audio from prompts, camera directions, storyboards, and image-to-video pipelines. Actions: generate video prompt, plan video scenes, render promotional video showcase, configure LTX-2 pipeline."
argument-hint: "[prompt] [camera-movement] [style] [resolution]"
license: MIT
metadata:
  author: lightricks-ecosystem
  version: "2.3.0"
---

# LTX-2 / LTX-Video: Generative Audio-Video Foundation Model Skill

Official knowledge base, prompt engineering framework, and generation workflow for **Lightricks LTX-2** — the open-weight audio-video foundation model powered by an asymmetric dual-stream Diffusion Transformer (DiT).

---

## 1. Core Architecture & Capabilities

- **Joint Audio-Visual Modeling**: Unlike traditional systems that generate video first and synthesize audio in a separate pass, LTX-2 models the joint probability distribution of video frames and synchronized multi-channel audio simultaneously.
- **Diffusion Transformer (DiT) Backbone**:
  - `ltx-2-19b-dev`: 19-billion parameter base model for cinematic generation and fine-tuning.
  - `ltx-2-19b-distilled`: 8-step fast-inference model for low-latency production.
  - `ltx-2-spatial-upscaler-x2`: Latent spatial upscaling for 4K clarity.
  - `ltx-2-temporal-upscaler-x2`: Frame-rate interpolation up to 60fps cinematic fluidity.
- **Supported Generation Modes**:
  1. **Text-to-Audio-Video (T2AV)**: Full scene generation from descriptive prompts.
  2. **Image-to-Audio-Video (I2AV)**: Animate brand assets, UI screenshots, or concept art.
  3. **Video-to-Video & Inpainting**: Modifying specific scene elements while retaining camera trajectory.

---

## 2. Official LTX-2 Prompt Engineering Blueprint

Lightricks models respond best to **single, continuous narrative paragraphs** that describe action, appearance, camera movement, and audio environment chronologically.

### Prompt Formula:
```
[Subject & Initial Action] + [Camera Trajectory & Lens] + [Environment & Lighting] + [Material & Textures] + [Pacing & Audio Cues]
```

### Key Prompt Rules:
1. **Action-First Structure**: Start directly with the action in present tense (e.g., *"A glowing educational badge floats into frame..."*).
2. **Explicit Camera Directions**:
   - `Dolly Push-In`: Moving forward into the subject.
   - `Orbital Track`: Sweeping 360-degree rotation maintaining focus on center.
   - `Crane Lift / Tilt Down`: Cinematic top-down establishing shot.
   - `Smooth Macro Zoom`: Focusing on typography or crisp UI elements.
3. **Lighting & Physics**: Specify light direction, volumetric glow, subsurface scattering, ambient occlusions, and lens flare.
4. **Synchronized Audio Elements**: Explicitly describe background soundtrack tempo, whoosh sound effects on transitions, and ambient room tone.

---

## 3. Python Pipeline Integration (Diffusers / LTX Core)

```python
import torch
from diffusers import LTXVideoPipeline

pipe = LTXVideoPipeline.from_pretrained(
    "Lightricks/LTX-Video",
    torch_dtype=torch.bfloat16
)
pipe.to("cuda")

prompt = (
    "Cinematic commercial showcase of KEdu education platform. The camera slowly pushes in "
    "on a modern glowing tablet displaying interactive high school exam questions. "
    "Soft volumetric studio lighting with crimson red and deep navy blue accent lights. "
    "Crisp typography, 4k resolution, smooth 60fps motion with subtle lens flare."
)

video = pipe(
    prompt=prompt,
    num_inference_steps=50,
    guidance_scale=3.5,
    width=768,
    height=512,
    num_frames=97
).frames[0]
```

---

## 4. Web Video Player Integration Best Practices (UI/UX Pro Max)

When deploying generated videos onto a modern website homepage:
1. **Hero Video Banner / Showcase Card**: Provide an elegant container with rounded corners (`20px+`), glassmorphism controls, and ambient glowing backdrops.
2. **Custom Controls**:
   - Play/Pause toggle with tactile SVG icons.
   - Progress bar / timeline with hover preview.
   - Volume mute/unmute control.
   - Fullscreen button.
3. **Poster Fallback**: Always include a high-contrast poster image before playback begins to eliminate black layout shifts.
4. **Performance & Accessibility**:
   - Use `preload="metadata"` to conserve user bandwidth.
   - Provide `aria-label` on all player buttons.
   - Support keyboard controls (`Space` to toggle, `M` to mute, `F` for fullscreen).
