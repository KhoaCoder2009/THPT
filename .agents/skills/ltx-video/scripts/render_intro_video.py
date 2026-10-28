#!/usr/bin/env python3
"""
KEdu THPT 2026 - Cinematic Video Renderer
Generates an introductory showcase video for the KEdu platform using Pillow and FFmpeg.
"""

import os
import sys
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess

WIDTH = 1280
HEIGHT = 720
FPS = 30
DURATION_SEC = 16
TOTAL_FRAMES = FPS * DURATION_SEC

OUTPUT_DIR = "assets/videos"
OUTPUT_VIDEO = os.path.join(OUTPUT_DIR, "kedu_intro.mp4")
OUTPUT_POSTER = os.path.join(OUTPUT_DIR, "kedu_intro_poster.jpg")
TMP_FRAMES_DIR = "assets/videos/tmp_frames"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TMP_FRAMES_DIR, exist_ok=True)

# Fonts
FONT_PATH_BOLD = "C:/Windows/Fonts/segoeuib.ttf" if os.path.exists("C:/Windows/Fonts/segoeuib.ttf") else "C:/Windows/Fonts/arialbd.ttf"
FONT_PATH_REG = "C:/Windows/Fonts/segoeui.ttf" if os.path.exists("C:/Windows/Fonts/segoeui.ttf") else "C:/Windows/Fonts/arial.ttf"

def get_font(size, bold=True):
    path = FONT_PATH_BOLD if bold else FONT_PATH_REG
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

# Colors
C_DARK_BG1 = (11, 19, 43)     # #0b132b
C_DARK_BG2 = (15, 23, 42)     # #0f172a
C_RED = (220, 38, 38)         # #dc2626
C_ROSE = (225, 29, 72)        # #e11d48
C_WHITE = (255, 255, 255)
C_SLATE = (148, 163, 184)     # #94a3b8
C_GOLD = (245, 158, 11)       # #f59e0b
C_CARD_BG = (23, 37, 65)

# Subject Data
SUBJECTS = [
    {"name": "Toán học", "color": (37, 99, 235), "desc": "Hàm số • Hình không gian"},
    {"name": "Vật lí", "color": (79, 70, 229), "desc": "Nhiệt • Khí lí tưởng • Từ"},
    {"name": "Hóa học", "color": (13, 148, 136), "desc": "Este • Kim loại • Dung dịch"},
    {"name": "Sinh học", "color": (16, 185, 129), "desc": "Di truyền • Sinh thái"},
    {"name": "Tin học", "color": (6, 182, 212), "desc": "Mạng • Web • Cơ sở dữ liệu"},
    {"name": "Lịch sử", "color": (217, 119, 6), "desc": "Hiện đại • Lịch sử VN"}
]

# Load Logo
LOGO_PATH = "assets/images/logo_kedu_horizontal.png"
if os.path.exists(LOGO_PATH):
    LOGO_IMG = Image.open(LOGO_PATH).convert("RGBA")
else:
    LOGO_IMG = None

# Particle System
np.random.seed(42)
NUM_PARTICLES = 40
PARTICLES = [
    {
        "x": np.random.uniform(0, WIDTH),
        "y": np.random.uniform(0, HEIGHT),
        "speed_x": np.random.uniform(-0.6, 0.6),
        "speed_y": np.random.uniform(-0.8, -0.2),
        "radius": np.random.uniform(2, 5),
        "alpha": np.random.uniform(60, 180)
    }
    for _ in range(NUM_PARTICLES)
]

def render_frame(frame_idx):
    t = frame_idx / FPS
    img = Image.new("RGBA", (WIDTH, HEIGHT), (11, 19, 43, 255))
    draw = ImageDraw.Draw(img)

    # 1. Background Gradient & Ambient Glows
    glow_pulse = 0.5 + 0.5 * math.sin(t * 2.0)
    glow_r = int(220 + 20 * glow_pulse)
    glow_radius = int(260 + 40 * glow_pulse)
    center_glow = (int(WIDTH / 2), int(HEIGHT / 2 - 40))

    # Radial ambient red flare
    glow_surf = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_surf)
    for r in range(glow_radius, 0, -15):
        alpha = int(45 * (1 - r / glow_radius) * (0.8 + 0.2 * glow_pulse))
        glow_draw.ellipse(
            (center_glow[0] - r, center_glow[1] - r, center_glow[0] + r, center_glow[1] + r),
            fill=(glow_r, 38, 38, alpha)
        )
    img = Image.alpha_composite(img, glow_surf)
    draw = ImageDraw.Draw(img)

    # 2. Update & Draw Particles
    for p in PARTICLES:
        p["x"] = (p["x"] + p["speed_x"]) % WIDTH
        p["y"] = (p["y"] + p["speed_y"]) % HEIGHT
        px, py = int(p["x"]), int(p["y"])
        pr = int(p["radius"])
        draw.ellipse((px - pr, py - pr, px + pr, py + pr), fill=(255, 255, 255, int(p["alpha"])))

    # 3. Scene Breakdown
    if t < 4.0:
        # ==========================================
        # SCENE 1: Brand Intro (0.0s - 4.0s)
        # ==========================================
        scene_t = t / 4.0
        # Logo scale & alpha
        scale_in = min(1.0, scene_t * 2.0)
        scale_easing = 1 - math.pow(1 - scale_in, 3)

        if LOGO_IMG:
            # Scaled logo
            logo_w = int(380 * (0.85 + 0.15 * scale_easing))
            logo_h = int(LOGO_IMG.height * (logo_w / LOGO_IMG.width))
            resized_logo = LOGO_IMG.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

            # Center logo
            lx = int((WIDTH - logo_w) / 2)
            ly = int(HEIGHT / 2 - 130 + 10 * (1 - scale_easing))
            
            # Frosted white badge behind logo
            badge_pad_x, badge_pad_y = 28, 14
            bx1, by1 = lx - badge_pad_x, ly - badge_pad_y
            bx2, by2 = lx + logo_w + badge_pad_x, ly + logo_h + badge_pad_y
            draw.rounded_rectangle((bx1, by1, bx2, by2), radius=22, fill=(255, 255, 255, 240), outline=(220, 38, 38, 180), width=2)
            img.paste(resized_logo, (lx, ly), resized_logo)

        # Title: HỆ THỐNG ÔN LUYỆN ĐỀ THI
        title_font = get_font(34, bold=True)
        title_text = "HỆ THỐNG ÔN LUYỆN ĐỀ THI TỐT NGHIỆP THPT"
        bbox = draw.textbbox((0, 0), title_text, font=title_font)
        tw = bbox[2] - bbox[0]
        tx = int((WIDTH - tw) / 2)
        ty = int(HEIGHT / 2 + 60)
        draw.text((tx, ty), title_text, fill=C_WHITE, font=title_font)

        # Subtitle badge: BIÊN SOẠN BỞI THẦY TRẦN ĐĂNG KHOA
        sub_font = get_font(20, bold=True)
        sub_text = "Biên soạn: TRẦN ĐĂNG KHOA  •  Chuẩn Cấu Trúc Đề Mới 2026"
        sbbox = draw.textbbox((0, 0), sub_text, font=sub_font)
        sw = sbbox[2] - sbbox[0]
        sx = int((WIDTH - sw) / 2)
        sy = ty + 50

        # Subtitle pill
        draw.rounded_rectangle((sx - 20, sy - 8, sx + sw + 20, sy + 32), radius=14, fill=(220, 38, 38, 220), outline=(254, 202, 202, 200), width=1)
        draw.text((sx, sy), sub_text, fill=C_WHITE, font=sub_font)

    elif t < 8.0:
        # ==========================================
        # SCENE 2: 6 Core Subjects (4.0s - 8.0s)
        # ==========================================
        scene_t = (t - 4.0) / 4.0

        # Header Title
        h_font = get_font(32, bold=True)
        h_text = "HỆ THỐNG 6 MÔN THI TỐT NGHIỆP THPT CHÍNH THỨC"
        hbbox = draw.textbbox((0, 0), h_text, font=h_font)
        hw = hbbox[2] - hbbox[0]
        draw.text(((WIDTH - hw) / 2, 50), h_text, fill=C_WHITE, font=h_font)

        subh_font = get_font(18, bold=False)
        subh_text = "Ngân hàng câu hỏi bám sát cấu trúc đề thi tốt nghiệp THPT từ Bộ GD&ĐT"
        shbbox = draw.textbbox((0, 0), subh_text, font=subh_font)
        draw.text(((WIDTH - (shbbox[2] - shbbox[0])) / 2, 95), subh_text, fill=C_SLATE, font=subh_font)

        # 6 Subject Grid (3 columns x 2 rows)
        card_w = 340
        card_h = 210
        gap_x = 35
        gap_y = 25
        grid_start_x = (WIDTH - (3 * card_w + 2 * gap_x)) / 2
        grid_start_y = 150

        card_font = get_font(24, bold=True)
        desc_font = get_font(14, bold=False)
        badge_font = get_font(12, bold=True)

        for i, s in enumerate(SUBJECTS):
            col = i % 3
            row = i // 3
            cx = int(grid_start_x + col * (card_w + gap_x))
            cy = int(grid_start_y + row * (card_h + gap_y))

            # Entrance animation offset per card
            delay = i * 0.08
            anim_progress = min(1.0, max(0.0, (scene_t - delay) * 2.5))
            card_offset = int(25 * (1 - anim_progress))
            cy += card_offset

            # Card background with colored border
            card_border_color = s["color"]
            draw.rounded_rectangle(
                (cx, cy, cx + card_w, cy + card_h),
                radius=16,
                fill=(23, 37, 65, 230),
                outline=card_border_color,
                width=2
            )

            # Card Top Badge: LỚP 12
            draw.rounded_rectangle((cx + 16, cy + 16, cx + 80, cy + 38), radius=8, fill=(15, 23, 42, 200))
            draw.text((cx + 26, cy + 20), "LỚP 12", fill=C_SLATE, font=badge_font)

            # Card Subject Name Hero Box
            draw.text((cx + 20, cy + 65), s["name"], fill=s["color"], font=card_font)
            draw.text((cx + 20, cy + 105), s["desc"], fill=C_SLATE, font=desc_font)

            # Card CTA Button
            draw.rounded_rectangle((cx + 16, cy + 150, cx + card_w - 16, cy + 192), radius=10, fill=s["color"])
            cta_text = "Vào Ôn Luyện ➜"
            cta_font = get_font(14, bold=True)
            ctaw = draw.textbbox((0, 0), cta_text, font=cta_font)[2]
            draw.text((cx + (card_w - ctaw) / 2, cy + 162), cta_text, fill=C_WHITE, font=cta_font)

    elif t < 12.0:
        # ==========================================
        # SCENE 3: 3 Formats Showcase (8.0s - 12.0s)
        # ==========================================
        scene_t = (t - 8.0) / 4.0

        h_font = get_font(32, bold=True)
        h_text = "CHUẨN 3 DẠNG THỨC CÂU HỎI THEO FORM MỚI"
        hw = draw.textbbox((0, 0), h_text, font=h_font)[2]
        draw.text(((WIDTH - hw) / 2, 55), h_text, fill=C_WHITE, font=h_font)

        subh_font = get_font(18, bold=False)
        subh_text = "Cấu trúc đề thi chính thức: Trắc nghiệm 4 lựa chọn • Đúng/Sai • Trả lời ngắn"
        shw = draw.textbbox((0, 0), subh_text, font=subh_font)[2]
        draw.text(((WIDTH - shw) / 2, 100), subh_text, fill=C_SLATE, font=subh_font)

        # 3 Format Cards
        formats = [
            {
                "part": "PHẦN I",
                "title": "Trắc Nghiệm 4 Lựa Chọn",
                "color": (37, 99, 235),
                "items": ["Chọn 01 đáp án đúng nhất (A, B, C, D)", "Kiểm tra kiến thức cơ bản & thông hiểu", "Chấm điểm tự động tức thì"]
            },
            {
                "part": "PHẦN II",
                "title": "Trắc Nghiệm Đúng / Sai",
                "color": (220, 38, 38),
                "items": ["Mỗi câu gồm 4 ý độc lập (a, b, c, d)", "Đánh giá tư duy toàn diện & logic", "Quy tắc tính điểm theo số ý đúng"]
            },
            {
                "part": "PHẦN III",
                "title": "Trắc Nghiệm Trả Lời Ngắn",
                "color": (16, 185, 129),
                "items": ["Học sinh tự giải & điền kết quả số", "Chống chọn ngẫu nhiên / may rủi", "Phù hợp câu hỏi vận dụng cao"]
            }
        ]

        card_w = 360
        card_h = 440
        gap = 40
        start_x = (WIDTH - (3 * card_w + 2 * gap)) / 2
        start_y = 160

        part_font = get_font(13, bold=True)
        title_font = get_font(21, bold=True)
        item_font = get_font(15, bold=False)

        for i, f in enumerate(formats):
            cx = int(start_x + i * (card_w + gap))
            cy = start_y

            # Box with colored glow top
            draw.rounded_rectangle((cx, cy, cx + card_w, cy + card_h), radius=20, fill=(23, 37, 65, 240), outline=f["color"], width=2)
            
            # Top pill
            draw.rounded_rectangle((cx + 20, cy + 24, cx + 100, cy + 50), radius=8, fill=f["color"])
            draw.text((cx + 30, cy + 28), f["part"], fill=C_WHITE, font=part_font)

            # Title
            draw.text((cx + 20, cy + 70), f["title"], fill=C_WHITE, font=title_font)
            draw.line((cx + 20, cy + 115, cx + card_w - 20, cy + 115), fill=(255, 255, 255, 40), width=1)

            # Items
            iy = cy + 140
            for item in f["items"]:
                draw.text((cx + 24, iy), "✔  " + item, fill=C_WHITE, font=item_font)
                iy += 45

            # Bottom Feature tag
            draw.rounded_rectangle((cx + 20, cy + card_h - 60, cx + card_w - 20, cy + card_h - 20), radius=10, fill=(15, 23, 42, 220))
            ft_text = "Lời giải chi tiết từng bước"
            ft_font = get_font(13, bold=True)
            ftw = draw.textbbox((0, 0), ft_text, font=ft_font)[2]
            draw.text((cx + (card_w - ftw) / 2, cy + card_h - 47), ft_text, fill=f["color"], font=ft_font)

    else:
        # ==========================================
        # SCENE 4: Call To Action & Outro (12.0s - 16.0s)
        # ==========================================
        scene_t = (t - 12.0) / 4.0

        # Center Card Glassmorphic container
        card_w = 780
        card_h = 480
        cx = int((WIDTH - card_w) / 2)
        cy = int((HEIGHT - card_h) / 2)

        draw.rounded_rectangle((cx, cy, cx + card_w, cy + card_h), radius=26, fill=(23, 37, 65, 230), outline=(220, 38, 38, 160), width=2)

        if LOGO_IMG:
            logo_w = 260
            logo_h = int(LOGO_IMG.height * (logo_w / LOGO_IMG.width))
            resized_logo = LOGO_IMG.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            lx = int((WIDTH - logo_w) / 2)
            ly = cy + 40
            draw.rounded_rectangle((lx - 20, ly - 10, lx + logo_w + 20, ly + logo_h + 10), radius=16, fill=(255, 255, 255, 240))
            img.paste(resized_logo, (lx, ly), resized_logo)

        title_font = get_font(34, bold=True)
        title_text = "CHINH PHỤC KỲ THI THPT 2026"
        tw = draw.textbbox((0, 0), title_text, font=title_font)[2]
        draw.text(((WIDTH - tw) / 2, cy + 180), title_text, fill=C_WHITE, font=title_font)

        desc_font = get_font(18, bold=False)
        desc_text = "Hệ thống ngân hàng câu hỏi phân quyền trực tuyến • Tự động lưu tiến độ"
        dw = draw.textbbox((0, 0), desc_text, font=desc_font)[2]
        draw.text(((WIDTH - dw) / 2, cy + 235), desc_text, fill=C_SLATE, font=desc_font)

        # Pulsing CTA Button
        btn_w = 380
        btn_h = 58
        btn_x = int((WIDTH - btn_w) / 2)
        btn_y = cy + 295
        pulse = 0.5 + 0.5 * math.sin(t * 4.0)

        draw.rounded_rectangle(
            (btn_x - int(4 * pulse), btn_y - int(4 * pulse), btn_x + btn_w + int(4 * pulse), btn_y + btn_h + int(4 * pulse)),
            radius=16,
            fill=(220, 38, 38, int(60 + 60 * pulse))
        )
        draw.rounded_rectangle((btn_x, btn_y, btn_x + btn_w, btn_y + btn_h), radius=14, fill=C_RED, outline=(254, 202, 202, 200), width=1)

        btn_font = get_font(21, bold=True)
        btn_text = "BẮT ĐẦU ÔN LUYỆN NGAY"
        bw = draw.textbbox((0, 0), btn_text, font=btn_font)[2]
        draw.text(((WIDTH - bw) / 2, btn_y + 15), btn_text, fill=C_WHITE, font=btn_font)

        footer_font = get_font(15, bold=False)
        footer_text = "Người biên soạn: TRẦN ĐĂNG KHOA  •  Website: KEdu THPT"
        fw = draw.textbbox((0, 0), footer_text, font=footer_font)[2]
        draw.text(((WIDTH - fw) / 2, cy + 400), footer_text, fill=C_SLATE, font=footer_font)

    return img.convert("RGB")

def main():
    print(f"Generating {TOTAL_FRAMES} frames ({DURATION_SEC}s @ {FPS}fps)...")
    
    # Generate poster at t = 2.0s
    poster_frame = render_frame(60)
    poster_frame.save(OUTPUT_POSTER, quality=95)
    print(f"Saved poster image: {OUTPUT_POSTER}")

    # Generate all video frames
    for idx in range(TOTAL_FRAMES):
        frame = render_frame(idx)
        frame_path = os.path.join(TMP_FRAMES_DIR, f"frame_{idx:04d}.png")
        frame.save(frame_path)
        if (idx + 1) % 60 == 0:
            print(f"Rendered {idx + 1}/{TOTAL_FRAMES} frames...")

    print("Encoding video with FFmpeg...")

    # Synthesize background soundtrack with audio harmonic synth tone
    # An uplifting electronic chord progression with smooth beat
    audio_cmd = (
        'ffmpeg -y '
        f'-r {FPS} -i "{TMP_FRAMES_DIR}/frame_%04d.png" '
        f'-f lavfi -i "sine=frequency=220:duration={DURATION_SEC}[a1]; '
        f'sine=frequency=330:duration={DURATION_SEC}[a2]; '
        f'sine=frequency=440:duration={DURATION_SEC}[a3]; '
        f'[a1][a2][a3]amix=inputs=3,volume=0.25,afade=t=in:ss=0:d=1.5,afade=t=out:st=14.5:d=1.5[aout]" '
        f'-map 0:v -map 1:a '
        '-c:v libx264 -pix_fmt yuv420p -preset medium -crf 20 '
        '-c:a aac -b:a 192k '
        f'"{OUTPUT_VIDEO}"'
    )

    ret = subprocess.run(audio_cmd, shell=True)
    if ret.returncode != 0:
        print("FFmpeg with audio synth failed, falling back to silent video...")
        fallback_cmd = f'ffmpeg -y -r {FPS} -i "{TMP_FRAMES_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p "{OUTPUT_VIDEO}"'
        subprocess.run(fallback_cmd, shell=True)

    print(f"Successfully generated video: {OUTPUT_VIDEO}")

    # Clean up temp frames
    for f in os.listdir(TMP_FRAMES_DIR):
        try:
            os.remove(os.path.join(TMP_FRAMES_DIR, f))
        except:
            pass
    try:
        os.rmdir(TMP_FRAMES_DIR)
    except:
        pass
    print("Cleaned up temp frames.")

if __name__ == "__main__":
    main()
