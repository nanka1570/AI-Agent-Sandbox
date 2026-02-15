#!/usr/bin/env python3
"""
Strict sprite cleaning: keep only the largest connected component
and components whose pixels are directly adjacent to it.
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


def find_components(img):
    """Find connected components of non-transparent pixels (8-connected)."""
    w, h = img.size
    px = img.load()
    visited = [[False] * w for _ in range(h)]
    components = []

    for sy in range(h):
        for sx in range(w):
            if visited[sy][sx] or px[sx, sy][3] < 10:
                continue
            comp = []
            queue = deque([(sx, sy)])
            visited[sy][sx] = True
            while queue:
                x, y = queue.popleft()
                comp.append((x, y))
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1),
                               (-1, -1), (1, -1), (-1, 1), (1, 1)]:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and px[nx, ny][3] >= 10:
                        visited[ny][nx] = True
                        queue.append((nx, ny))
            components.append(comp)
    return components


def is_adjacent(comp_pixels_set, other_comp, proximity=3):
    """Check if any pixel in other_comp is within 'proximity' pixels of comp_pixels_set."""
    for x, y in other_comp:
        for dx in range(-proximity, proximity + 1):
            for dy in range(-proximity, proximity + 1):
                if (x + dx, y + dy) in comp_pixels_set:
                    return True
    return False


def clean_cell_strict(cell_img):
    """Remove ghost characters keeping only the main character cluster.

    1. Find all connected components
    2. Start with the largest as "main"
    3. Iteratively add components that are pixel-adjacent (within 3px) to the main cluster
    4. Remove everything else
    """
    w, h = cell_img.size
    comps = find_components(cell_img)

    if len(comps) <= 1:
        return cell_img

    comps.sort(key=len, reverse=True)

    # Start with largest component
    main_pixels = set((x, y) for x, y in comps[0])

    # Iteratively merge adjacent components
    remaining = comps[1:]
    changed = True
    while changed:
        changed = False
        new_remaining = []
        for comp in remaining:
            if is_adjacent(main_pixels, comp, proximity=3):
                for x, y in comp:
                    main_pixels.add((x, y))
                changed = True
            else:
                new_remaining.append(comp)
        remaining = new_remaining

    # Create cleaned cell
    result = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    src_px = cell_img.load()
    dst_px = result.load()

    for x, y in main_pixels:
        dst_px[x, y] = src_px[x, y]

    return result


def clean_and_align(path, cell_w, cell_h, align='bottom-center'):
    """Clean and realign all cells in a spritesheet."""
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    cols = w // cell_w
    rows = h // cell_h

    output = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    for row in range(rows):
        for col in range(cols):
            x1 = col * cell_w
            y1 = row * cell_h
            cell = img.crop((x1, y1, x1 + cell_w, y1 + cell_h))

            cleaned = clean_cell_strict(cell)
            bbox = cleaned.getbbox()
            if not bbox:
                continue

            content = cleaned.crop(bbox)
            cw, ch = content.size

            if align == 'bottom-center':
                paste_x = (cell_w - cw) // 2
                paste_y = cell_h - ch
            else:
                paste_x = (cell_w - cw) // 2
                paste_y = (cell_h - ch) // 2

            output.paste(content, (x1 + paste_x, y1 + paste_y), content)

    return output


def verify(path, cell_w, cell_h, name):
    img = Image.open(path).convert('RGBA')
    cols = img.size[0] // cell_w
    rows = img.size[1] // cell_h
    multi = 0
    for row in range(rows):
        for col in range(cols):
            cell = img.crop((col * cell_w, row * cell_h,
                             (col + 1) * cell_w, (row + 1) * cell_h))
            comps = find_components(cell)
            big = [c for c in comps if len(c) > 15]
            if len(big) > 1:
                multi += 1
                sizes = sorted([len(c) for c in big], reverse=True)
                print(f"  {name} Row {row} Col {col}: {len(big)} blobs, sizes={sizes}")
    total = cols * rows
    print(f"  Multi-blob cells: {multi}/{total}")
    return multi


# === Player ===
print("=== Player Sheet ===")
player = clean_and_align(f'{BASE}/player_sheet.png', 48, 48, 'bottom-center')
safe_save(player, f'{BASE}/player_sheet.png')
print(f"  Saved: {player.size}")
verify(f'{BASE}/player_sheet.png', 48, 48, "Player")

# === Slime ===
print("\n=== Slime Sheet ===")
slime = clean_and_align(f'{BASE}/enemy_slime_sheet.png', 32, 32, 'bottom-center')
safe_save(slime, f'{BASE}/enemy_slime_sheet.png')
print(f"  Saved: {slime.size}")
verify(f'{BASE}/enemy_slime_sheet.png', 32, 32, "Slime")

# === Bat ===
print("\n=== Bat Sheet ===")
bat = clean_and_align(f'{BASE}/enemy_bat_sheet.png', 32, 32, 'center')
safe_save(bat, f'{BASE}/enemy_bat_sheet.png')
print(f"  Saved: {bat.size}")
verify(f'{BASE}/enemy_bat_sheet.png', 32, 32, "Bat")

print("\n=== Done ===")
