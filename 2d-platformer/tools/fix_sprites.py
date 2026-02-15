#!/usr/bin/env python3
"""
Fix spritesheet transparency and cell boundaries.
For each cell: trim edges (remove adjacent character bleed),
then flood-fill background removal from cell edges.
"""
from PIL import Image
from collections import deque
import os

BASE = '/home/nanka/projects/2d-platformer/assets/sprites'


def safe_save(img, path):
    if os.path.exists(path):
        try:
            img.save(path)
            return
        except PermissionError:
            os.remove(path)
    img.save(path)


def flood_fill_cell(img, threshold=55):
    """Flood fill bg removal for a single small cell.
    Propagates through already-transparent pixels."""
    img = img.convert('RGBA')
    w, h = img.size
    px = img.load()

    # Sample background from corners (skip transparent)
    pts = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1),
           (w//2, 0), (0, h//2), (w-1, h//2), (w//2, h-1)]
    samples = []
    for x, y in pts:
        r, g, b, a = px[x, y]
        if a > 10:
            samples.append((r, g, b))

    if not samples:
        return img  # All corners transparent

    bg_r = sum(s[0] for s in samples) // len(samples)
    bg_g = sum(s[1] for s in samples) // len(samples)
    bg_b = sum(s[2] for s in samples) // len(samples)

    th_sq = threshold * threshold
    visited = bytearray(w * h)

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

        # Already transparent: propagate through
        if a < 10:
            if x > 0 and not visited[idx - 1]: queue.append(idx - 1)
            if x < w-1 and not visited[idx + 1]: queue.append(idx + 1)
            if y > 0 and not visited[idx - w]: queue.append(idx - w)
            if y < h-1 and not visited[idx + w]: queue.append(idx + w)
            continue

        dsq = (r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2
        if dsq < th_sq:
            px[x, y] = (r, g, b, 0)
            if x > 0 and not visited[idx - 1]: queue.append(idx - 1)
            if x < w-1 and not visited[idx + 1]: queue.append(idx + 1)
            if y > 0 and not visited[idx - w]: queue.append(idx - w)
            if y < h-1 and not visited[idx + w]: queue.append(idx + w)

    return img


def fix_spritesheet(path, cell_w, cell_h, trim=4, bg_threshold=55):
    """Fix transparency in an already-processed spritesheet.
    For each cell: trim edges to remove adjacent character bleed,
    then flood-fill to clean up background."""
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    cols = w // cell_w
    rows = h // cell_h

    output = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    for row in range(rows):
        for col in range(cols):
            x1 = col * cell_w
            y1 = row * cell_h

            # Crop cell with inward trim (removes adjacent character bleed)
            trimmed = img.crop((
                x1 + trim, y1 + trim,
                x1 + cell_w - trim, y1 + cell_h - trim
            ))

            # Apply flood fill on the trimmed cell
            trimmed = flood_fill_cell(trimmed, bg_threshold)

            # Place back in output with transparent padding
            output.paste(trimmed, (x1 + trim, y1 + trim), trimmed)

    return output


# === Fix Player Sheet ===
print("=== Fixing Player Sheet ===")
player = fix_spritesheet(
    f'{BASE}/player_sheet.png',
    cell_w=48, cell_h=48, trim=4, bg_threshold=55
)
safe_save(player, f'{BASE}/player_sheet.png')
print(f"  Done: {player.size[0]}x{player.size[1]}")

# === Fix Slime Sheet ===
print("=== Fixing Slime Sheet ===")
slime = fix_spritesheet(
    f'{BASE}/enemy_slime_sheet.png',
    cell_w=32, cell_h=32, trim=3, bg_threshold=60
)
safe_save(slime, f'{BASE}/enemy_slime_sheet.png')
print(f"  Done: {slime.size[0]}x{slime.size[1]}")

# === Fix Bat Sheet ===
print("=== Fixing Bat Sheet ===")
bat = fix_spritesheet(
    f'{BASE}/enemy_bat_sheet.png',
    cell_w=32, cell_h=32, trim=3, bg_threshold=55
)
safe_save(bat, f'{BASE}/enemy_bat_sheet.png')
print(f"  Done: {bat.size[0]}x{bat.size[1]}")

print("\n=== All spritesheets fixed! ===")
