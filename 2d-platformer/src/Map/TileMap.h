// タイルマップクラス
// マップデータの保持・描画・当たり判定用のタイル情報取得を担当する
// タイルサイズは32x32px（設計書 §6）
// loadStage()でステージごとに異なるマップを読み込む

#pragma once

#include <string>
#include <vector>

#include <SFML/Graphics.hpp>

class TileMap {
public:
    TileMap();
    void loadStage(int stageId);  // 指定ステージのマップを生成する

    void render(sf::RenderWindow& window) const;  // 画面内のタイルだけを描画する

    // 指定タイル座標が壁・地面（通過不可）かどうかを返す
    bool isSolid(int tileX, int tileY) const;

    // 指定範囲（ワールド座標）内にある壁タイルの矩形リストを返す（当たり判定用）
    std::vector<sf::FloatRect> getSolidTilesInRange(const sf::FloatRect& area) const;

    int getTileSize() const;
    int getMapWidth() const;       // マップ幅（タイル数）
    int getMapHeight() const;      // マップ高さ（タイル数）
    float getPixelWidth() const;   // マップ幅（ピクセル）
    float getPixelHeight() const;  // マップ高さ（ピクセル）

private:
    std::vector<std::vector<int>> terrainData;  // タイルID配列（0=空、1=壁）
    int tileSize;    // 1タイルのピクセルサイズ（32）
    int mapWidth;    // マップ幅（タイル数）
    int mapHeight;   // マップ高さ（タイル数）

    // タイルセットテクスチャのファイルパス
    std::string tilesetPath;

    // 各ステージの地形を生成する内部メソッド
    void buildStage1();
    void buildStage2();
    void buildStage3();

    // タイルの種類に応じたテクスチャ矩形を返す（簡易オートタイリング）
    sf::IntRect getTileRect(int tileX, int tileY) const;

    // タイルセットのグリッドサイズ（16x16タイル、32x32px）
    static constexpr int TILESET_COLS = 16;
};
