#!/usr/bin/env python3
"""
Process all game assets to match code expectations.
Uses flood-fill background removal and cell-by-cell sprite extraction
to ensure proper transparency and no cell-boundary overlap.
"""
from PIL import Image
from collections import deque
import os

BASE = '/home/nanka/projects/2d-platformer/assets/sprites'


def safe_save(img, path):
    """Save image, handling root-owned files."""
    if os.path.exists(path):
        try:
            img.save(path)
            return
        except PermissionError:
            os.remove(path)
    img.save(path)


def flood_fill_remove_bg(img, threshold=55):
    """Remove background connected to image edges via flood fill.
    Only removes pixels that are connected to the edge AND close to
    the sampled background color. This preserves interior details."""
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()

    # Sample background from corners + edge midpoints
    pts = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1),
           (w//2, 0), (w//2, h-1), (0, h//2), (w-1, h//2)]
    samples = [px[x, y][:3] for x, y in pts]
    bg_r = sum(s[0] for s in samples) // len(samples)
    bg_g = sum(s[1] for s in samples) // len(samples)
    bg_b = sum(s[2] for s in samples) // len(samples)

    th_sq = threshold * threshold
    visited = bytearray(w * h)

    # Seed BFS from all edge pixels
    queue = deque()
    for x in range(w):
        queue.append(x)
        queue.append(x + (h - 1) * w)
    for y in range(1, h - 1):
        queue.append(y * w)
        queue.append(w - 1 + y * w)

    while queue:
        idx = queue.popleft()
        if visited[idx]:
            continue
        visited[idx] = 1

        x = idx % w
        y = idx // w
        r, g, b, a = px[x, y]
        dsq = (r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2

        if dsq < th_sq:
            px[x, y] = (r, g, b, 0)
            if x > 0 and not visited[idx - 1]:
                queue.append(idx - 1)
            if x < w - 1 and not visited[idx + 1]:
                queue.append(idx + 1)
            if y > 0 and not visited[idx - w]:
                queue.append(idx - w)
            if y < h - 1 and not visited[idx + w]:
                queue.append(idx + w)

    return img


def process_spritesheet(path, src_cols, src_rows, label_w,
                        target_cell_w, target_cell_h,
                        target_cols, target_rows,
                        row_map=None, align='bottom-center',
                        bg_threshold=55):
    """Process a spritesheet: flood-fill bg removal, cell-by-cell extraction."""
    print(f"  Loading and removing background...")
    img = Image.open(path).convert('RGBA')
    img = flood_fill_remove_bg(img, bg_threshold)

    w, h = img.size
    content_w = w - label_w
    cell_w = content_w / src_cols
    cell_h = h / src_rows

    if row_map is None:
        row_map = list(range(target_rows))

    out_w = target_cols * target_cell_w
    out_h = target_rows * target_cell_h
    output = Image.new('RGBA', (out_w, out_h), (0, 0, 0, 0))

    print(f"  Extracting cells ({target_cols}x{target_rows})...")
    for dst_row in range(target_rows):
        src_row = row_map[dst_row]
        for col in range(target_cols):
            if col >= src_cols:
                continue

            # Crop source cell
            x1 = int(label_w + col * cell_w)
            y1 = int(src_row * cell_h)
            x2 = int(label_w + (col + 1) * cell_w)
            y2 = int((src_row + 1) * cell_h)
            cell = img.crop((x1, y1, x2, y2))

            # Find non-transparent content bounds
            bbox = cell.getbbox()
            if not bbox:
                continue
            content = cell.crop(bbox)
            cw, ch = content.size

            # Scale to fit target cell (preserve aspect ratio)
            margin = 1
            max_w = target_cell_w - margin * 2
            max_h = target_cell_h - margin * 2
            scale = min(max_w / max(1, cw), max_h / max(1, ch))
            new_w = max(1, int(cw * scale))
            new_h = max(1, int(ch * scale))
            content = content.resize((new_w, new_h), Image.LANCZOS)

            # Position in target cell
            if align == 'bottom-center':
                paste_x = (target_cell_w - new_w) // 2
                paste_y = target_cell_h - new_h - margin
            else:  # center
                paste_x = (target_cell_w - new_w) // 2
                paste_y = (target_cell_h - new_h) // 2

            dx = col * target_cell_w + paste_x
            dy = dst_row * target_cell_h + paste_y
            output.paste(content, (dx, dy), content)

    return output


# ===================================================================
# PLAYER SHEET
# Source: 1024x559, 6 cols x 5 rows (row 4 = misc items, skip)
# Target: 288x384 (6x8 grid of 48x48 cells)
# ===================================================================
print("=== Player Sheet ===")
# Row map: [Idle, Running, Jumping, Falling, Attacking, Dashing, WallSlide, Hit]
#        -> [src0, src1,    src2,    src3,    src2,      src1,    src0,      src3]
player = process_spritesheet(
    f'{BASE}/player_sheet.png',
    src_cols=6, src_rows=5, label_w=0,
    target_cell_w=48, target_cell_h=48,
    target_cols=6, target_rows=8,
    row_map=[0, 1, 2, 3, 2, 1, 0, 3],
    align='bottom-center',
    bg_threshold=55
)
safe_save(player, f'{BASE}/player_sheet.png')
print(f"  Saved: {player.size[0]}x{player.size[1]}")


# ===================================================================
# SLIME SHEET
# Source: 1024x559, 6 cols x 3 rows, labels on left ~70px
# Target: 128x96 (4x3 grid of 32x32 cells)
# ===================================================================
print("\n=== Slime Sheet ===")
slime = process_spritesheet(
    f'{BASE}/enemy_slime_sheet.png',
    src_cols=6, src_rows=3, label_w=70,
    target_cell_w=32, target_cell_h=32,
    target_cols=4, target_rows=3,
    align='bottom-center',
    bg_threshold=60  # Higher for near-white bg with grid lines
)
safe_save(slime, f'{BASE}/enemy_slime_sheet.png')
print(f"  Saved: {slime.size[0]}x{slime.size[1]}")


# ===================================================================
# BAT SHEET
# Source: 1024x559, 6 cols x 3 rows, labels on left ~90px
# Target: 128x96 (4x3 grid of 32x32 cells)
# ===================================================================
print("\n=== Bat Sheet ===")
bat = process_spritesheet(
    f'{BASE}/enemy_bat_sheet.png',
    src_cols=6, src_rows=3, label_w=90,
    target_cell_w=32, target_cell_h=32,
    target_cols=4, target_rows=3,
    align='center',   # Bat pivot is center
    bg_threshold=55
)
safe_save(bat, f'{BASE}/enemy_bat_sheet.png')
print(f"  Saved: {bat.size[0]}x{bat.size[1]}")


# ===================================================================
# TILESETS
# Source: 1024x559, reference art
# Target: 128x128 (4x4 grid of 32x32 for auto-tiling)
# ===================================================================
print("\n=== Tilesets ===")
for ts_name in ['tileset_forest.png', 'tileset_castle.png', 'tileset_tower.png']:
    print(f"  Processing {ts_name}...")
    img = Image.open(f'{BASE}/{ts_name}').convert('RGBA')
    w, h = img.size

    surface_end = int(h * 0.12)
    interior_end = int(h * 0.25)

    surface = img.crop((0, 0, w, surface_end))
    interior = img.crop((0, surface_end, w, interior_end))

    surface_row = surface.resize((128, 32), Image.LANCZOS)
    interior_row = interior.resize((128, 32), Image.LANCZOS)

    output = Image.new('RGBA', (128, 128))
    output.paste(surface_row, (0, 0))
    output.paste(interior_row, (0, 32))
    output.paste(interior_row, (0, 64))
    output.paste(surface_row, (0, 96))

    safe_save(output, f'{BASE}/{ts_name}')
    print(f"    Saved: {output.size[0]}x{output.size[1]}")


# ===================================================================
# BACKGROUNDS - resize to 640x360
# ===================================================================
print("\n=== Backgrounds ===")
for f in sorted(os.listdir(BASE)):
    if f.startswith('bg_') and f.endswith('.png'):
        path = f'{BASE}/{f}'
        img = Image.open(path).convert('RGBA')
        if img.size != (640, 360):
            print(f"  {f}: {img.size[0]}x{img.size[1]} -> 640x360")
            img = img.resize((640, 360), Image.LANCZOS)
            safe_save(img, path)
        else:
            print(f"  {f}: already 640x360")


# ===================================================================
# UI ELEMENTS - resize to expected dimensions
# ===================================================================
print("\n=== UI Elements ===")
ui_sizes = {
    'logo_title.png': (400, 200),
    'text_stage_clear.png': (400, 100),
    'text_game_over.png': (400, 100),
    'ui_button_standard.png': (200, 60),
    'ui_button_hover.png': (200, 60),
    'ui_heart_full.png': (32, 32),
    'ui_heart_empty.png': (32, 32),
    'ui_stage_frame_1.png': (128, 128),
    'ui_stage_frame_2.png': (128, 128),
    'ui_stage_frame_3.png': (128, 128),
}

for fname, (tw, th) in ui_sizes.items():
    path = f'{BASE}/ui/{fname}'
    if os.path.exists(path):
        img = Image.open(path).convert('RGBA')
        if img.size != (tw, th):
            print(f"  {fname}: {img.size[0]}x{img.size[1]} -> {tw}x{th}")
            img = img.resize((tw, th), Image.LANCZOS)
            safe_save(img, path)
        else:
            print(f"  {fname}: already correct size")
    else:
        print(f"  {fname}: NOT FOUND")


print("\n=== All assets processed! ===")
