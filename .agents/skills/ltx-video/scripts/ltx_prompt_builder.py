#!/usr/bin/env python3
"""
LTX-2 Prompt & Storyboard Builder
Generates prompt sequences and camera directions formatted for Lightricks LTX-2.
"""

import sys
import argparse
import json

SCENE_TEMPLATES = {
    "brand_intro": {
        "action": "A sleek glowing 3D logo of {brand} rotates smoothly in center frame against an ambient studio backdrop.",
        "camera": "Slow cinematic dolly zoom in, 35mm lens, shallow depth of field with creamy bokeh.",
        "lighting": "Volumetric crimson and deep navy blue rim lighting, subtle anamorphic lens flare across the frame.",
        "audio": "Inspiring ambient electronic synth swell, building energetic momentum with clean low-end bass."
    },
    "product_feature": {
        "action": "Interactive question cards and exam analytics charts glide forward, displaying crisp numbers and high school subjects.",
        "camera": "Smooth orbital panning shot tracking left to right with slight upward tilt.",
        "lighting": "Clean studio key light at 45 degrees, soft reflective highlights on glass surfaces.",
        "audio": "Crisp tactile interface foley clicks, rising harmonic chords, uplifting modern rhythm."
    },
    "call_to_action": {
        "action": "A bold interactive button pulses gently as particle embers disperse into the dark background, concluding with {brand} brand mark.",
        "camera": "Locked center framing, gentle micro push-in, perfectly centered composition.",
        "lighting": "Dramatic top spotlight illuminating the emblem with sharp metallic reflection.",
        "audio": "Resonant final musical chord, smooth whoosh transition, memorable logo chime outro."
    }
}

def build_prompt(brand="KEdu", subject="THPT 2026 Exam Platform"):
    prompts = []
    for scene_id, data in SCENE_TEMPLATES.items():
        formatted_action = data["action"].format(brand=brand, subject=subject)
        full_prompt = f"{formatted_action} {data['camera']} {data['lighting']} {data['audio']}"
        prompts.append({
            "scene": scene_id,
            "prompt": full_prompt,
            "duration_sec": 4.0
        })
    return prompts

def main():
    parser = argparse.ArgumentParser(description="LTX-2 Prompt Builder")
    parser.add_argument("--brand", default="KEdu", help="Brand name")
    parser.add_argument("--subject", default="Hệ Thống Ôn Luyện Thi Tốt Nghiệp THPT 2026", help="Platform subject")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    storyboard = build_prompt(args.brand, args.subject)

    if args.json:
        print(json.dumps(storyboard, indent=2, ensure_ascii=False))
    else:
        print(f"=== LTX-2 Storyboard for {args.brand} ===")
        for i, s in enumerate(storyboard, 1):
            print(f"\n[Scene {i}: {s['scene'].upper()}] ({s['duration_sec']}s)")
            print(s["prompt"])

if __name__ == "__main__":
    main()
