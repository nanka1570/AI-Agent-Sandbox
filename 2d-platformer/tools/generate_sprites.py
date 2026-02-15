#!/usr/bin/env python3
"""
Generate clean pixel-art spritesheets for all characters.

Why this script exists:
  The original AI-generated spritesheets had "ghost characters" (fragments
  from adjacent frames) in most cells. A cleaning script removed them but
  also removed legitimate character parts (feet, head, sword). Since the
  originals were overwritten and can't be recovered, this script generates
  fresh, clean sprites from scratch.

What it generates:
  - player_sheet.png: 288x384 (6x8 grid of 48x48 cells)
    Row 0: Idle (1 frame), Row 1: Running (6 frames),
    Row 2: Jumping (2), Row 3: Falling (2), Row 4: Attacking (4),
    Row 5: Dashing (2), Row 6: WallSlide (2), Row 7: Hit (1)
  - enemy_slime_sheet.png: 128x96 (4x3 grid of 32x32 cells)
    Row 0: Idle (1), Row 1: Move (4), Row 2: Hit (1)
  - enemy_bat_sheet.png: 128x96 (4x3 grid of 32x32 cells)
    Row 0: Fly (4), Row 1: Attack (2), Row 2: Hit (1)

Alignment:
  - Player/Slime: bottom-center (feet at cell bottom)
  - Bat: center
"""
from PIL import Image, ImageDraw
import os, math

BASE = '/home/nanka/projects/2d-platformer/assets/sprites'


def safe_save(img, path):
    if os.path.exists(path):
        try:
            img.save(path)
            return
        except PermissionError:
            os.remove(path)
    img.save(path)


# ===========================================================
# Color palette
# ===========================================================
SKIN       = (240, 200, 160, 255)
SKIN_DARK  = (200, 160, 120, 255)
HAIR       = (60, 40, 30, 255)
TUNIC      = (60, 100, 180, 255)
TUNIC_DARK = (40, 70, 140, 255)
TUNIC_LT   = (90, 130, 210, 255)
BELT       = (120, 80, 40, 255)
BOOT       = (100, 60, 30, 255)
BOOT_DARK  = (70, 40, 20, 255)
SWORD_BLADE = (200, 210, 220, 255)
SWORD_HILT  = (160, 130, 50, 255)
SWORD_EDGE  = (230, 235, 240, 255)
EYE         = (255, 255, 255, 255)
PUPIL       = (30, 30, 50, 255)

SLIME_BODY   = (80, 200, 80, 255)
SLIME_DARK   = (50, 150, 50, 255)
SLIME_LIGHT  = (120, 230, 120, 255)
SLIME_EYE_W  = (255, 255, 255, 255)
SLIME_EYE_P  = (30, 30, 30, 255)

BAT_BODY   = (100, 50, 120, 255)
BAT_DARK   = (70, 30, 90, 255)
BAT_WING   = (130, 70, 150, 255)
BAT_WING_D = (90, 40, 110, 255)
BAT_EYE    = (255, 50, 50, 255)


# ===========================================================
# Helper: draw a filled rectangle with optional outline
# ===========================================================
def rect(draw, x, y, w, h, fill, outline=None):
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=fill, outline=outline)


def pixel(draw, x, y, color):
    draw.point((x, y), fill=color)


# ===========================================================
# Player sprite drawing
# ===========================================================
def draw_player_base(draw, cx, by, facing_right=True):
    """Draw base player body. cx=center x, by=bottom y (feet bottom)."""
    # Head (8x8)
    hx = cx - 4
    hy = by - 30
    rect(draw, hx, hy, 8, 8, SKIN)
    # Hair top
    rect(draw, hx, hy, 8, 3, HAIR)
    # Eyes
    if facing_right:
        pixel(draw, cx + 1, hy + 4, EYE)
        pixel(draw, cx + 2, hy + 4, PUPIL)
    else:
        pixel(draw, cx - 2, hy + 4, EYE)
        pixel(draw, cx - 3, hy + 4, PUPIL)

    # Neck
    rect(draw, cx - 1, by - 22, 2, 2, SKIN)

    # Body/Tunic (12x10)
    rect(draw, cx - 6, by - 20, 12, 10, TUNIC)
    # Belt
    rect(draw, cx - 6, by - 12, 12, 2, BELT)

    # Arms (default: down at sides)
    rect(draw, cx - 8, by - 19, 2, 8, TUNIC_DARK)
    rect(draw, cx - 8, by - 11, 2, 3, SKIN)
    rect(draw, cx + 6, by - 19, 2, 8, TUNIC_DARK)
    rect(draw, cx + 6, by - 11, 2, 3, SKIN)

    return hx, hy


def draw_legs_standing(draw, cx, by):
    """Standing legs."""
    # Left leg
    rect(draw, cx - 4, by - 10, 4, 6, TUNIC_DARK)
    rect(draw, cx - 4, by - 4, 4, 4, BOOT)
    # Right leg
    rect(draw, cx, by - 10, 4, 6, TUNIC_DARK)
    rect(draw, cx, by - 4, 4, 4, BOOT)


def draw_legs_run(draw, cx, by, phase):
    """Running legs with phase 0-5."""
    offsets = [(-3, 0, 3, -2), (-2, -1, 2, 1), (0, -2, 0, 2),
               (3, -2, -3, 0), (2, 1, -2, -1), (0, 2, 0, -2)]
    lx, ly, rx, ry = offsets[phase % 6]
    # Left leg
    rect(draw, cx - 4 + lx, by - 10 + ly, 4, 6, TUNIC_DARK)
    rect(draw, cx - 4 + lx, by - 4 + ly, 4, 4, BOOT)
    # Right leg
    rect(draw, cx + rx, by - 10 + ry, 4, 6, TUNIC_DARK)
    rect(draw, cx + rx, by - 4 + ry, 4, 4, BOOT)


def draw_sword(draw, cx, by, phase, total_frames):
    """Draw sword at various attack phases."""
    progress = phase / max(1, total_frames - 1)
    if progress < 0.25:
        # Wind up: sword behind
        sx, sy = cx + 8, by - 24
        rect(draw, sx, sy, 2, 12, SWORD_BLADE)
        rect(draw, sx, sy + 12, 2, 3, SWORD_HILT)
    elif progress < 0.5:
        # Swing up
        sx, sy = cx + 10, by - 26
        rect(draw, sx, sy, 2, 14, SWORD_BLADE)
        pixel(draw, sx, sy, SWORD_EDGE)
    elif progress < 0.75:
        # Swing forward (horizontal)
        sx, sy = cx + 6, by - 20
        rect(draw, sx, sy, 14, 2, SWORD_BLADE)
        pixel(draw, sx + 13, sy, SWORD_EDGE)
        rect(draw, sx - 2, sy - 1, 3, 4, SWORD_HILT)
    else:
        # Follow through
        sx, sy = cx + 8, by - 16
        rect(draw, sx, sy, 12, 2, SWORD_BLADE)
        pixel(draw, sx + 11, sy, SWORD_EDGE)
        rect(draw, sx - 2, sy - 1, 3, 4, SWORD_HILT)


def generate_player_sheet():
    """Generate 288x384 player spritesheet (6 cols x 8 rows of 48x48)."""
    cell_w, cell_h = 48, 48
    cols, rows = 6, 8
    img = Image.new('RGBA', (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def cell_origin(row, col):
        """Return (center_x, bottom_y) for a cell."""
        return col * cell_w + cell_w // 2, (row + 1) * cell_h

    # Row 0: Idle (1 frame used, draw 1)
    for col in range(1):
        cx, by = cell_origin(0, col)
        draw_player_base(draw, cx, by)
        draw_legs_standing(draw, cx, by)

    # Row 1: Running (6 frames)
    for col in range(6):
        cx, by = cell_origin(1, col)
        draw_player_base(draw, cx, by)
        draw_legs_run(draw, cx, by, col)

    # Row 2: Jumping (2 frames)
    for col in range(2):
        cx, by = cell_origin(2, col)
        # Body shifted up slightly
        hy_off = -3 if col == 0 else -5
        draw_player_base(draw, cx, by + hy_off)
        # Tucked legs
        rect(draw, cx - 5, by - 8 + hy_off, 4, 5, TUNIC_DARK)
        rect(draw, cx - 5, by - 3 + hy_off, 4, 3, BOOT)
        rect(draw, cx + 1, by - 8 + hy_off, 4, 5, TUNIC_DARK)
        rect(draw, cx + 1, by - 3 + hy_off, 4, 3, BOOT)

    # Row 3: Falling (2 frames)
    for col in range(2):
        cx, by = cell_origin(3, col)
        draw_player_base(draw, cx, by)
        spread = 2 if col == 0 else 4
        # Spread legs
        rect(draw, cx - 5 - spread, by - 10, 4, 6, TUNIC_DARK)
        rect(draw, cx - 5 - spread, by - 4, 4, 4, BOOT)
        rect(draw, cx + 1 + spread, by - 10, 4, 6, TUNIC_DARK)
        rect(draw, cx + 1 + spread, by - 4, 4, 4, BOOT)

    # Row 4: Attacking (4 frames)
    for col in range(4):
        cx, by = cell_origin(4, col)
        draw_player_base(draw, cx, by)
        draw_legs_standing(draw, cx, by)
        draw_sword(draw, cx, by, col, 4)

    # Row 5: Dashing (2 frames)
    for col in range(2):
        cx, by = cell_origin(5, col)
        lean = 3 + col * 2
        # Leaning forward body
        draw_player_base(draw, cx + lean, by)
        # Trailing legs
        rect(draw, cx - 6 + lean, by - 10, 4, 7, TUNIC_DARK)
        rect(draw, cx - 6 + lean, by - 3, 4, 3, BOOT)
        rect(draw, cx - 2 + lean, by - 10, 4, 7, TUNIC_DARK)
        rect(draw, cx - 2 + lean, by - 3, 4, 3, BOOT)
        # Speed lines
        for i in range(3):
            y = by - 20 + i * 5
            rect(draw, cx - 12 + lean, y, 6, 1, (200, 200, 255, 150))

    # Row 6: WallSlide (2 frames)
    for col in range(2):
        cx, by = cell_origin(6, col)
        draw_player_base(draw, cx, by - col * 2)
        # Legs pressed together
        rect(draw, cx - 3, by - 10 - col * 2, 6, 7, TUNIC_DARK)
        rect(draw, cx - 3, by - 3 - col * 2, 6, 3, BOOT)
        # Hand on wall (right side)
        rect(draw, cx + 7, by - 22 - col * 2, 3, 4, SKIN)

    # Row 7: Hit (1 frame)
    for col in range(1):
        cx, by = cell_origin(7, col)
        # Knocked back pose
        draw_player_base(draw, cx - 2, by - 2)
        # Legs flying
        rect(draw, cx - 6, by - 8, 4, 5, TUNIC_DARK)
        rect(draw, cx - 6, by - 3, 4, 3, BOOT)
        rect(draw, cx + 2, by - 10, 4, 5, TUNIC_DARK)
        rect(draw, cx + 2, by - 5, 4, 3, BOOT)

    return img


# ===========================================================
# Slime sprite drawing
# ===========================================================
def draw_slime(draw, cx, by, squish=0, hop_y=0, hit=False):
    """Draw slime blob. cx=center, by=bottom."""
    # Squish: negative=squashed wider, positive=stretched taller
    w = 12 + squish * 2
    h = 10 - squish
    x0 = cx - w // 2
    y0 = by - h - hop_y

    color = (180, 80, 80, 255) if hit else SLIME_BODY
    dark = (140, 50, 50, 255) if hit else SLIME_DARK
    light = (220, 120, 120, 255) if hit else SLIME_LIGHT

    # Body (rounded: narrower at top)
    rect(draw, x0 + 1, y0, w - 2, 2, color)      # Top narrow
    rect(draw, x0, y0 + 2, w, h - 4, color)       # Main body
    rect(draw, x0 + 1, y0 + h - 2, w - 2, 2, dark)  # Bottom

    # Highlight
    rect(draw, x0 + 2, y0 + 1, 3, 2, light)

    # Eyes
    eye_y = y0 + 3
    pixel(draw, cx - 3, eye_y, SLIME_EYE_W)
    pixel(draw, cx - 2, eye_y, SLIME_EYE_P)
    pixel(draw, cx + 1, eye_y, SLIME_EYE_W)
    pixel(draw, cx + 2, eye_y, SLIME_EYE_P)


def generate_slime_sheet():
    """Generate 128x96 slime spritesheet (4 cols x 3 rows of 32x32)."""
    cell_w, cell_h = 32, 32
    cols, rows = 4, 3
    img = Image.new('RGBA', (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def cell_origin(row, col):
        return col * cell_w + cell_w // 2, (row + 1) * cell_h

    # Row 0: Idle (1 frame)
    cx, by = cell_origin(0, 0)
    draw_slime(draw, cx, by)

    # Row 1: Move (4 frames) - bounce cycle
    squishes = [0, -2, 0, 2]   # normal, squash, normal, stretch
    hops =     [0, 0, 3, 1]    # ground, ground, hop, coming down
    for col in range(4):
        cx, by = cell_origin(1, col)
        draw_slime(draw, cx, by, squish=squishes[col], hop_y=hops[col])

    # Row 2: Hit (1 frame)
    cx, by = cell_origin(2, 0)
    draw_slime(draw, cx, by, squish=-1, hit=True)

    return img


# ===========================================================
# Bat sprite drawing
# ===========================================================
def draw_bat(draw, cx, cy, wing_phase=0, attacking=False, hit=False):
    """Draw bat. cx, cy = center."""
    body_color = (180, 60, 60, 255) if hit else BAT_BODY
    wing_color = (150, 50, 50, 255) if hit else BAT_WING
    wing_dk = (110, 30, 30, 255) if hit else BAT_WING_D

    # Body (6x6 oval)
    rect(draw, cx - 3, cy - 3, 6, 6, body_color)
    # Ears
    pixel(draw, cx - 2, cy - 4, body_color)
    pixel(draw, cx + 1, cy - 4, body_color)

    # Eyes
    pixel(draw, cx - 1, cy - 1, BAT_EYE)
    pixel(draw, cx + 1, cy - 1, BAT_EYE)

    # Wings based on phase
    wing_offsets = [
        (-2, 0),   # wings level
        (-4, -2),  # wings up
        (-2, 0),   # wings level
        (0, 2),    # wings down
    ]
    wx, wy = wing_offsets[wing_phase % 4]

    # Left wing
    rect(draw, cx - 9, cy + wy - 1, 6, 4, wing_color)
    rect(draw, cx - 10, cy + wy, 2, 2, wing_dk)
    # Right wing
    rect(draw, cx + 3, cy + wy - 1, 6, 4, wing_color)
    rect(draw, cx + 9, cy + wy, 2, 2, wing_dk)

    if attacking:
        # Show fangs / attack indicator
        pixel(draw, cx - 1, cy + 2, (255, 255, 255, 255))
        pixel(draw, cx + 1, cy + 2, (255, 255, 255, 255))


def generate_bat_sheet():
    """Generate 128x96 bat spritesheet (4 cols x 3 rows of 32x32)."""
    cell_w, cell_h = 32, 32
    cols, rows = 4, 3
    img = Image.new('RGBA', (cols * cell_w, rows * cell_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def cell_center(row, col):
        return col * cell_w + cell_w // 2, row * cell_h + cell_h // 2

    # Row 0: Fly (4 frames) - wing flap cycle
    for col in range(4):
        cx, cy = cell_center(0, col)
        draw_bat(draw, cx, cy, wing_phase=col)

    # Row 1: Attack (2 frames)
    for col in range(2):
        cx, cy = cell_center(1, col)
        draw_bat(draw, cx, cy, wing_phase=col, attacking=True)

    # Row 2: Hit (1 frame)
    cx, cy = cell_center(2, 0)
    draw_bat(draw, cx, cy, wing_phase=0, hit=True)

    return img


# ===========================================================
# Generate and save all sheets
# ===========================================================
print("=== Generating Player Sheet ===")
player = generate_player_sheet()
safe_save(player, f'{BASE}/player_sheet.png')
print(f"  Size: {player.size}")

# Verify: check each cell for content
for row in range(8):
    frames_with_content = 0
    for col in range(6):
        cell = player.crop((col * 48, row * 48, (col + 1) * 48, (row + 1) * 48))
        if cell.getbbox():
            frames_with_content += 1
    state_names = ['Idle', 'Running', 'Jumping', 'Falling',
                   'Attacking', 'Dashing', 'WallSlide', 'Hit']
    expected = [1, 6, 2, 2, 4, 2, 2, 1]
    status = "OK" if frames_with_content >= expected[row] else "LOW"
    print(f"  Row {row} ({state_names[row]}): {frames_with_content} frames [{status}]")

print("\n=== Generating Slime Sheet ===")
slime = generate_slime_sheet()
safe_save(slime, f'{BASE}/enemy_slime_sheet.png')
print(f"  Size: {slime.size}")

print("\n=== Generating Bat Sheet ===")
bat = generate_bat_sheet()
safe_save(bat, f'{BASE}/enemy_bat_sheet.png')
print(f"  Size: {bat.size}")

print("\n=== All spritesheets generated! ===")
