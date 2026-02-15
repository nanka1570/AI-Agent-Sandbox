#!/usr/bin/env python3
"""
Fix tileset display and sprite alignment.

1. Generate proper procedural tilesets (4x4 grid of 32x32 tiles)
   - Each row has a consistent visual theme
   - Columns represent proper edge variants (left/center/right/standalone)

2. Bottom-align character sprites within their cells
   - Player: bottom-center in 48x48 cells (origin at 24, 48)
   - Slime: bottom-center in 32x32 cells (origin at 16, 32)
   - Bat: center in 32x32 cells (origin at 16, 16)
"""
from PIL import Image, ImageDraw
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


# =====================================================================
# Part 1: Generate proper tilesets
# =====================================================================

def draw_tile(draw, x0, y0, ts, colors, has_above, has_below, has_left, has_right):
    """Draw a single tile at (x0, y0) with proper edges and texturing.

    colors: dict with 'surface', 'fill', 'fill_dark', 'edge_light', 'edge_dark'
    has_above/below/left/right: whether there's a solid tile in that direction
    """
    surface = colors['surface']
    fill = colors['fill']
    fill_dark = colors['fill_dark']
    edge_light = colors['edge_light']
    edge_dark = colors['edge_dark']

    # Base fill
    draw.rectangle([x0, y0, x0 + ts - 1, y0 + ts - 1], fill=fill)

    # Surface strip at top (if no tile above)
    if not has_above:
        # 8px surface layer
        draw.rectangle([x0, y0, x0 + ts - 1, y0 + 7], fill=surface)
        # Thin highlight at very top
        draw.rectangle([x0, y0, x0 + ts - 1, y0 + 1], fill=edge_light)

    # Bottom edge (if no tile below)
    if not has_below:
        draw.rectangle([x0, y0 + ts - 3, x0 + ts - 1, y0 + ts - 1], fill=edge_dark)

    # Left edge (if no tile to the left)
    if not has_left:
        draw.rectangle([x0, y0, x0 + 2, y0 + ts - 1], fill=edge_dark)
        # Light inner edge
        draw.line([(x0 + 3, y0), (x0 + 3, y0 + ts - 1)], fill=edge_light)

    # Right edge (if no tile to the right)
    if not has_right:
        draw.rectangle([x0 + ts - 3, y0, x0 + ts - 1, y0 + ts - 1], fill=edge_dark)
        # Light inner edge
        draw.line([(x0 + ts - 4, y0), (x0 + ts - 4, y0 + ts - 1)], fill=edge_light)

    # Add subtle texture (small dots scattered)
    import random
    random.seed(x0 * 1000 + y0)  # Deterministic per tile position
    for _ in range(8):
        dx = random.randint(4, ts - 5)
        dy = random.randint(4, ts - 5)
        px, py = x0 + dx, y0 + dy
        curr = fill
        # Check if this pixel is in a special region
        if not has_above and dy <= 7:
            curr = surface
        if not has_below and dy >= ts - 3:
            curr = edge_dark
        if not has_left and dx <= 3:
            continue
        if not has_right and dx >= ts - 4:
            continue
        # Slightly vary brightness
        variation = random.choice([-12, -8, 8, 12])
        varied = (
            max(0, min(255, curr[0] + variation)),
            max(0, min(255, curr[1] + variation)),
            max(0, min(255, curr[2] + variation)),
            255
        )
        draw.point((px, py), fill=varied)


def generate_tileset(colors):
    """Generate a 128x128 tileset (4 cols x 4 rows of 32x32 tiles).

    Grid layout:
      Row 0: Surface (above=empty, below=solid)
      Row 1: Middle  (above=solid, below=solid)
      Row 2: Bottom  (above=solid, below=empty)
      Row 3: Isolated (above=empty, below=empty)

      Col 0: Left edge  (left=empty, right=solid)
      Col 1: Center     (left=solid, right=solid)
      Col 2: Right edge (left=solid, right=empty)
      Col 3: Standalone (left=empty, right=empty)
    """
    ts = 32
    img = Image.new('RGBA', (4 * ts, 4 * ts), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    row_config = [
        # (has_above, has_below)
        (False, True),   # Row 0: Surface
        (True, True),    # Row 1: Middle
        (True, False),   # Row 2: Bottom
        (False, False),  # Row 3: Isolated
    ]
    col_config = [
        # (has_left, has_right)
        (False, True),   # Col 0: Left edge
        (True, True),    # Col 1: Center
        (True, False),   # Col 2: Right edge
        (False, False),  # Col 3: Standalone
    ]

    for row_idx, (has_above, has_below) in enumerate(row_config):
        for col_idx, (has_left, has_right) in enumerate(col_config):
            x0 = col_idx * ts
            y0 = row_idx * ts
            draw_tile(draw, x0, y0, ts, colors,
                      has_above, has_below, has_left, has_right)

    return img


# Forest: green grass surface, brown dirt fill
print("=== Generating Forest Tileset ===")
forest = generate_tileset({
    'surface':    (76, 153, 56, 255),
    'fill':       (139, 90, 43, 255),
    'fill_dark':  (110, 70, 35, 255),
    'edge_light': (95, 170, 70, 255),
    'edge_dark':  (100, 65, 30, 255),
})
safe_save(forest, f'{BASE}/tileset_forest.png')
print(f"  Saved: {forest.size}")

# Castle: gray stone
print("=== Generating Castle Tileset ===")
castle = generate_tileset({
    'surface':    (170, 170, 180, 255),
    'fill':       (110, 110, 120, 255),
    'fill_dark':  (90, 90, 100, 255),
    'edge_light': (150, 150, 160, 255),
    'edge_dark':  (70, 70, 80, 255),
})
safe_save(castle, f'{BASE}/tileset_castle.png')
print(f"  Saved: {castle.size}")

# Tower: dark purple/red
print("=== Generating Tower Tileset ===")
tower = generate_tileset({
    'surface':    (130, 55, 80, 255),
    'fill':       (75, 40, 60, 255),
    'fill_dark':  (60, 30, 50, 255),
    'edge_light': (140, 70, 95, 255),
    'edge_dark':  (45, 25, 40, 255),
})
safe_save(tower, f'{BASE}/tileset_tower.png')
print(f"  Saved: {tower.size}")


# =====================================================================
# Part 2: Fix sprite alignment within cells
# =====================================================================

def realign_spritesheet(path, cell_w, cell_h, align='bottom-center'):
    """For each cell in the spritesheet, find content and realign it.

    align='bottom-center': Move content so its bottom edge is at cell_h-1
    align='center': Move content to the center of the cell
    """
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

            bbox = cell.getbbox()
            if not bbox:
                continue  # Empty cell, skip

            # Extract content
            content = cell.crop(bbox)
            cw, ch = content.size

            if align == 'bottom-center':
                # Center horizontally, bottom-align vertically
                paste_x = (cell_w - cw) // 2
                paste_y = cell_h - ch  # Feet at very bottom of cell
            else:  # center
                paste_x = (cell_w - cw) // 2
                paste_y = (cell_h - ch) // 2

            dx = x1 + paste_x
            dy = y1 + paste_y
            output.paste(content, (dx, dy), content)

    return output


# Fix Player spritesheet (bottom-center align)
print("\n=== Fixing Player Sprite Alignment ===")
player_path = f'{BASE}/player_sheet.png'
player = realign_spritesheet(player_path, 48, 48, align='bottom-center')
safe_save(player, player_path)
print(f"  Saved: {player.size}")

# Verify alignment
img = Image.open(player_path).convert('RGBA')
for row in range(8):
    cell = img.crop((0, row * 48, 48, (row + 1) * 48))
    bbox = cell.getbbox()
    if bbox:
        print(f"  Row {row} Col 0: content at y={bbox[1]}-{bbox[3]}, "
              f"bottom gap={48 - bbox[3]}px")

# Fix Slime spritesheet (bottom-center align)
print("\n=== Fixing Slime Sprite Alignment ===")
slime_path = f'{BASE}/enemy_slime_sheet.png'
slime = realign_spritesheet(slime_path, 32, 32, align='bottom-center')
safe_save(slime, slime_path)
print(f"  Saved: {slime.size}")

# Fix Bat spritesheet (center align)
print("\n=== Fixing Bat Sprite Alignment ===")
bat_path = f'{BASE}/enemy_bat_sheet.png'
bat = realign_spritesheet(bat_path, 32, 32, align='center')
safe_save(bat, bat_path)
print(f"  Saved: {bat.size}")

print("\n=== All fixes applied! ===")
