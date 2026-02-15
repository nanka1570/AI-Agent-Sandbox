// タイルマップの実装
// 各ステージのマップデータをハードコードで生成する
// タイルセットテクスチャを使ってスプライト描画する

#include "Map/TileMap.h"
#include "System/ResourceManager.h"

#include <algorithm>

TileMap::TileMap()
    : tileSize(32)
    , mapWidth(0)
    , mapHeight(0)
{
}

// 指定ステージのマップを読み込む
void TileMap::loadStage(int stageId)
{
    switch (stageId) {
    case 1:  buildStage1(); break;
    case 2:  buildStage2(); break;
    case 3:  buildStage3(); break;
    default: buildStage1(); break;
    }
}

// ==================================================================
// Stage 1: 森の入口（チュートリアル）
// 80x20タイル（2560x640px）  難易度 ★☆☆
// 構成: 平地 → 落とし穴 → 浮島 → 壁ジャンプ通路 → 敵 → ゴール
// ==================================================================
void TileMap::buildStage1()
{
    mapWidth = 80;
    mapHeight = 20;
    tilesetPath = "assets/sprites/tileset_forest.png";

    terrainData.assign(mapHeight, std::vector<int>(mapWidth, 0));

    auto addPlatform = [&](int row, int startCol, int length) {
        for (int x = startCol; x < startCol + length && x < mapWidth; ++x)
            terrainData[row][x] = 1;
    };
    auto addWall = [&](int col, int startRow, int endRow) {
        for (int y = startRow; y <= endRow && y < mapHeight; ++y)
            terrainData[y][col] = 1;
    };

    // 左端・右端の壁
    addWall(0, 0, 19);
    addWall(79, 0, 19);

    // 地面（row 19）
    addPlatform(19, 1, 14);    // cols 1-14
    addPlatform(19, 17, 3);    // cols 17-19
    addPlatform(19, 22, 17);   // cols 22-38
    addPlatform(19, 44, 36);   // cols 44-79

    // 浮島（Section 3）
    addPlatform(17, 24, 3);
    addPlatform(15, 28, 3);
    addPlatform(13, 24, 3);
    addPlatform(11, 30, 3);
    addPlatform(15, 34, 3);
    addPlatform(17, 32, 3);

    // 壁ジャンプ通路（Section 4）
    addWall(39, 7, 18);
    addWall(43, 7, 18);
    addPlatform(18, 40, 3);   // 縦穴の底

    // ゴール付近の台座
    addPlatform(18, 76, 2);
}

// ==================================================================
// Stage 2: 古城（壁ジャンプ重視の縦構成）
// 50x25タイル（1600x800px）  難易度 ★★☆
// 石壁・レンガイメージのグレー系タイル
// 下から上へ壁ジャンプで登っていく構成
// ==================================================================
void TileMap::buildStage2()
{
    mapWidth = 50;
    mapHeight = 25;
    tilesetPath = "assets/sprites/tileset_castle.png";

    terrainData.assign(mapHeight, std::vector<int>(mapWidth, 0));

    auto addPlatform = [&](int row, int startCol, int length) {
        for (int x = startCol; x < startCol + length && x < mapWidth; ++x)
            terrainData[row][x] = 1;
    };
    auto addWall = [&](int col, int startRow, int endRow) {
        for (int y = startRow; y <= endRow && y < mapHeight; ++y)
            terrainData[y][col] = 1;
    };

    // 外壁（天井・床・左右）
    addPlatform(0, 0, 50);    // 天井
    addPlatform(24, 0, 50);   // 床
    addWall(0, 0, 24);        // 左壁
    addWall(49, 0, 24);       // 右壁

    // === 下層: スタート地点（左下, row 23）===
    // 足場を右へ進んで最初の縦穴へ
    addPlatform(22, 5, 5);    // cols 5-9
    addPlatform(20, 12, 5);   // cols 12-16
    addPlatform(22, 20, 5);   // cols 20-24

    // === 縦穴1（右寄り, cols 33 and 37, rows 12-23）===
    // プレイヤーは右下の足場から落ちて壁ジャンプで登る
    addWall(33, 12, 23);
    addWall(37, 12, 23);
    addPlatform(23, 34, 3);   // 縦穴1の底
    addPlatform(22, 28, 4);   // 縦穴1への足場

    // === 中層: 縦穴1の上から左へ移動 ===
    addPlatform(11, 30, 5);   // 縦穴1出口の足場
    addPlatform(11, 22, 4);
    addPlatform(9, 16, 4);
    addPlatform(11, 10, 4);

    // === 縦穴2（左寄り, cols 4 and 9, rows 3-10）===
    // 天井(row 0)との隙間を2タイル(rows 1-2)確保して出入りしやすくする
    addWall(4, 3, 10);
    addWall(9, 3, 10);
    addPlatform(10, 5, 4);    // 縦穴2の底（cols 5-8）

    // === 上層: 縦穴2の上からゴールへ ===
    addPlatform(2, 10, 4);
    addPlatform(3, 18, 4);
    addPlatform(2, 26, 4);
    addPlatform(3, 34, 4);

    // ゴール台座（右上）
    addPlatform(2, 42, 4);
    addPlatform(3, 42, 1);
    addPlatform(3, 45, 1);
}

// ==================================================================
// Stage 3: 魔王の塔（全アクション総合ステージ）
// 80x25タイル（2560x800px）  難易度 ★★★
// 暗い紫/赤系タイルで禍々しい雰囲気
// 全アクション（移動・ジャンプ・壁ジャンプ・ダッシュ・攻撃）を使う
// ==================================================================
void TileMap::buildStage3()
{
    mapWidth = 80;
    mapHeight = 25;
    tilesetPath = "assets/sprites/tileset_tower.png";

    terrainData.assign(mapHeight, std::vector<int>(mapWidth, 0));

    auto addPlatform = [&](int row, int startCol, int length) {
        for (int x = startCol; x < startCol + length && x < mapWidth; ++x)
            terrainData[row][x] = 1;
    };
    auto addWall = [&](int col, int startRow, int endRow) {
        for (int y = startRow; y <= endRow && y < mapHeight; ++y)
            terrainData[y][col] = 1;
    };

    // 外壁
    addWall(0, 0, 24);
    addWall(79, 0, 24);
    addPlatform(0, 0, 80);    // 天井
    addPlatform(24, 0, 80);   // 床

    // === Section A: ジャンプ地帯（cols 1-18）===
    // 狭い足場を飛び移る。落とし穴あり
    // 床に穴を開ける
    for (int x = 5; x <= 7; ++x) terrainData[24][x] = 0;    // 穴1
    for (int x = 11; x <= 12; ++x) terrainData[24][x] = 0;  // 穴2
    for (int x = 16; x <= 17; ++x) terrainData[24][x] = 0;  // 穴3

    // 穴の間の狭い足場 + 浮島
    addPlatform(22, 3, 2);
    addPlatform(20, 7, 3);
    addPlatform(22, 13, 2);
    addPlatform(20, 16, 2);

    // === Section B: 壁ジャンプ+ダッシュ地帯（cols 19-35）===
    // 壁ジャンプで登り、ダッシュで隙間を越える
    addWall(20, 10, 23);      // 左壁
    addWall(24, 10, 23);      // 右壁
    addPlatform(23, 21, 3);   // 縦穴1底

    // 縦穴の上にダッシュ必須の区間（隙間が広い）
    addPlatform(9, 21, 3);    // 縦穴1出口
    addPlatform(9, 27, 2);    // ダッシュ先の足場
    addPlatform(10, 31, 3);

    // 第2の壁ジャンプ区間
    addWall(31, 12, 23);
    addWall(35, 12, 23);
    addPlatform(23, 32, 3);   // 縦穴2底
    addPlatform(11, 32, 3);   // 縦穴2出口

    // === Section C: 上層の足場+戦闘（cols 36-60）===
    addPlatform(10, 36, 5);
    addPlatform(12, 42, 5);
    addPlatform(10, 48, 5);
    addPlatform(12, 54, 5);
    addPlatform(10, 60, 3);

    // 下層に戻る経路（降りる足場）
    addPlatform(14, 62, 3);
    addPlatform(16, 58, 3);
    addPlatform(18, 62, 3);
    addPlatform(20, 58, 3);
    addPlatform(22, 62, 3);

    // === Section D: 最終戦闘+ゴール（cols 61-78）===
    // 上の addPlatform(24, 0, 80) で全床あり、穴は Section A のみ

    // 最終エリアに壁を配置（敵が溜まるように）
    addPlatform(22, 66, 2);
    addPlatform(20, 70, 3);
    addPlatform(22, 74, 2);

    // ゴール台座
    addPlatform(22, 76, 2);
    addPlatform(23, 76, 2);
}

// === 簡易オートタイリング ===
// 隣接タイルの状態に応じてタイルセット内の位置を決定する
sf::IntRect TileMap::getTileRect(int tileX, int tileY) const
{
    // 隣接タイルの状態を調べる
    bool above = (tileY > 0) && terrainData[tileY - 1][tileX] != 0;
    bool below = (tileY < mapHeight - 1) && terrainData[tileY + 1][tileX] != 0;
    bool left  = (tileX > 0) && terrainData[tileY][tileX - 1] != 0;
    bool right = (tileX < mapWidth - 1) && terrainData[tileY][tileX + 1] != 0;

    // タイルセットのグリッド座標（col, row）を決定
    int col = 0;
    int row = 0;

    if (!above && below) {
        // 表面タイル（上が空、下が壁）
        if (left && right)       { col = 1; row = 0; }  // 上面中央
        else if (!left && right) { col = 0; row = 0; }  // 上面左端
        else if (left && !right) { col = 2; row = 0; }  // 上面右端
        else                     { col = 3; row = 0; }  // 上面単独
    } else if (above && below) {
        // 中間タイル（上下が壁）
        if (left && right)       { col = 1; row = 1; }  // 中間中央
        else if (!left && right) { col = 0; row = 1; }  // 中間左端
        else if (left && !right) { col = 2; row = 1; }  // 中間右端
        else                     { col = 3; row = 1; }  // 中間単独列
    } else if (above && !below) {
        // 底面タイル（上が壁、下が空）
        if (left && right)       { col = 1; row = 2; }  // 底面中央
        else if (!left && right) { col = 0; row = 2; }  // 底面左端
        else if (left && !right) { col = 2; row = 2; }  // 底面右端
        else                     { col = 3; row = 2; }  // 底面単独
    } else {
        // 孤立タイル（上下とも空）
        if (left && right)       { col = 1; row = 3; }  // 横一列中央
        else if (!left && right) { col = 0; row = 3; }  // 横一列左端
        else if (left && !right) { col = 2; row = 3; }  // 横一列右端
        else                     { col = 3; row = 3; }  // 完全孤立
    }

    return sf::IntRect(col * tileSize, row * tileSize, tileSize, tileSize);
}

// === 描画 ===
// 画面内に表示されるタイルだけを描画する（カメラの表示範囲で絞り込み）
void TileMap::render(sf::RenderWindow& window) const
{
    sf::Sprite tileSprite(ResourceManager::getTexture(tilesetPath));

    // 現在のビューから描画範囲を計算する
    sf::View view = window.getView();
    sf::Vector2f center = view.getCenter();
    sf::Vector2f size = view.getSize();

    int startX = std::max(0, static_cast<int>((center.x - size.x / 2.f) / tileSize));
    int endX   = std::min(mapWidth - 1, static_cast<int>((center.x + size.x / 2.f) / tileSize));
    int startY = std::max(0, static_cast<int>((center.y - size.y / 2.f) / tileSize));
    int endY   = std::min(mapHeight - 1, static_cast<int>((center.y + size.y / 2.f) / tileSize));

    for (int y = startY; y <= endY; ++y) {
        for (int x = startX; x <= endX; ++x) {
            if (terrainData[y][x] != 0) {
                tileSprite.setTextureRect(getTileRect(x, y));
                tileSprite.setPosition(
                    static_cast<float>(x * tileSize),
                    static_cast<float>(y * tileSize));
                window.draw(tileSprite);
            }
        }
    }
}

// === 判定・取得メソッド ===

bool TileMap::isSolid(int tileX, int tileY) const
{
    if (tileX < 0 || tileX >= mapWidth || tileY < 0 || tileY >= mapHeight)
        return false;
    return terrainData[tileY][tileX] != 0;
}

std::vector<sf::FloatRect> TileMap::getSolidTilesInRange(const sf::FloatRect& area) const
{
    std::vector<sf::FloatRect> result;

    int startX = std::max(0, static_cast<int>(area.left / static_cast<float>(tileSize)));
    int startY = std::max(0, static_cast<int>(area.top / static_cast<float>(tileSize)));
    int endX   = std::min(mapWidth - 1,
                          static_cast<int>((area.left + area.width) / static_cast<float>(tileSize)));
    int endY   = std::min(mapHeight - 1,
                          static_cast<int>((area.top + area.height) / static_cast<float>(tileSize)));

    for (int y = startY; y <= endY; ++y) {
        for (int x = startX; x <= endX; ++x) {
            if (terrainData[y][x] != 0) {
                result.emplace_back(
                    static_cast<float>(x * tileSize),
                    static_cast<float>(y * tileSize),
                    static_cast<float>(tileSize),
                    static_cast<float>(tileSize));
            }
        }
    }
    return result;
}

int TileMap::getTileSize() const { return tileSize; }
int TileMap::getMapWidth() const { return mapWidth; }
int TileMap::getMapHeight() const { return mapHeight; }
float TileMap::getPixelWidth() const { return static_cast<float>(mapWidth * tileSize); }
float TileMap::getPixelHeight() const { return static_cast<float>(mapHeight * tileSize); }
