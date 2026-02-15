#!/usr/bin/env python3
"""
Clean spritesheets by removing ghost characters from each cell.

For each cell:
1. Find connected components of non-transparent pixels
2. Identify the largest component as the main character
3. Compute its bounding box with margin
4. Keep only pixels within that region, remove everything else
5. Re-center and bottom-align the cleaned content
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


def get_bbox(component):
    """Get bounding box (min_x, min_y, max_x, max_y) of a component."""
    xs = [p[0] for p in component]
    ys = [p[1] for p in component]
    return min(xs), min(ys), max(xs), max(ys)


def clean_cell(cell_img, margin=5):
    """Remove ghost characters from a cell, keeping only the main character.

    Strategy:
    1. Find all connected components
    2. The largest one is the main character body
    3. Compute bounding box of largest + any component that overlaps it (with margin)
    4. Remove all pixels outside this region
    """
    w, h = cell_img.size
    comps = find_components(cell_img)

    if len(comps) <= 1:
        return cell_img  # Nothing to clean

    # Sort by size, largest first
    comps.sort(key=len, reverse=True)
    largest = comps[0]

    # Get bounding box of the largest component with margin
    bx1, by1, bx2, by2 = get_bbox(largest)
    bx1 = max(0, bx1 - margin)
    by1 = max(0, by1 - margin)
    bx2 = min(w - 1, bx2 + margin)
    by2 = min(h - 1, by2 + margin)

    # Also include any component whose bounding box overlaps the main bbox
    # (these are likely disconnected parts of the same character)
    keep_pixels = set((x, y) for x, y in largest)
    for comp in comps[1:]:
        cx1, cy1, cx2, cy2 = get_bbox(comp)
        # Check if this component's bbox overlaps the main character's bbox
        if cx1 <= bx2 and cx2 >= bx1 and cy1 <= by2 and cy2 >= by1:
            for x, y in comp:
                keep_pixels.add((x, y))
        # Else: this component is spatially separated, remove it

    # Create cleaned cell
    result = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    src_px = cell_img.load()
    dst_px = result.load()

    for x, y in keep_pixels:
        dst_px[x, y] = src_px[x, y]

    return result


def clean_and_align_spritesheet(path, cell_w, cell_h, align='bottom-center', margin=5):
    """Clean ghost characters and realign content in each cell."""
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    cols = w // cell_w
    rows = h // cell_h

    output = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    cleaned_count = 0

    for row in range(rows):
        for col in range(cols):
            x1 = col * cell_w
            y1 = row * cell_h
            cell = img.crop((x1, y1, x1 + cell_w, y1 + cell_h))

            # Step 1: Clean ghost characters
            cleaned = clean_cell(cell, margin=margin)

            # Step 2: Check if cleaning actually removed something
            orig_bbox = cell.getbbox()
            clean_bbox = cleaned.getbbox()
            if orig_bbox and clean_bbox and orig_bbox != clean_bbox:
                cleaned_count += 1

            if not clean_bbox:
                continue  # Empty cell

            # Step 3: Extract content and realign
            content = cleaned.crop(clean_bbox)
            cw, ch = content.size

            if align == 'bottom-center':
                paste_x = (cell_w - cw) // 2
                paste_y = cell_h - ch
            else:  # center
                paste_x = (cell_w - cw) // 2
                paste_y = (cell_h - ch) // 2

            dx = x1 + paste_x
            dy = y1 + paste_y
            output.paste(content, (dx, dy), content)

    return output, cleaned_count


def verify_spritesheet(path, cell_w, cell_h, name):
    """Verify cleaned spritesheet has single blobs per cell."""
    img = Image.open(path).convert('RGBA')
    cols = img.size[0] // cell_w
    rows = img.size[1] // cell_h
    multi = 0
    for row in range(rows):
        for col in range(cols):
            cell = img.crop((col * cell_w, row * cell_h,
                             (col + 1) * cell_w, (row + 1) * cell_h))
            comps = find_components(cell)
            big = [c for c in comps if len(c) > 20]
            if len(big) > 1:
                multi += 1
                sizes = sorted([len(c) for c in big], reverse=True)
                print(f"  WARNING: {name} Row {row} Col {col}: "
                      f"{len(big)} blobs, sizes={sizes}")
    return multi


# === Clean Player Sheet ===
print("=== Cleaning Player Sheet ===")
player, pc = clean_and_align_spritesheet(
    f'{BASE}/player_sheet.png', 48, 48,
    align='bottom-center', margin=4
)
safe_save(player, f'{BASE}/player_sheet.png')
print(f"  Cleaned {pc} cells, saved: {player.size}")
multi = verify_spritesheet(f'{BASE}/player_sheet.png', 48, 48, "Player")
print(f"  Remaining multi-blob cells: {multi}/48")

# === Clean Slime Sheet ===
print("\n=== Cleaning Slime Sheet ===")
slime, sc = clean_and_align_spritesheet(
    f'{BASE}/enemy_slime_sheet.png', 32, 32,
    align='bottom-center', margin=3
)
safe_save(slime, f'{BASE}/enemy_slime_sheet.png')
print(f"  Cleaned {sc} cells, saved: {slime.size}")
multi = verify_spritesheet(f'{BASE}/enemy_slime_sheet.png', 32, 32, "Slime")
print(f"  Remaining multi-blob cells: {multi}/12")

# === Clean Bat Sheet ===
print("\n=== Cleaning Bat Sheet ===")
bat, bc = clean_and_align_spritesheet(
    f'{BASE}/enemy_bat_sheet.png', 32, 32,
    align='center', margin=3
)
safe_save(bat, f'{BASE}/enemy_bat_sheet.png')
print(f"  Cleaned {bc} cells, saved: {bat.size}")
multi = verify_spritesheet(f'{BASE}/enemy_bat_sheet.png', 32, 32, "Bat")
print(f"  Remaining multi-blob cells: {multi}/12")

print("\n=== All spritesheets cleaned! ===")
