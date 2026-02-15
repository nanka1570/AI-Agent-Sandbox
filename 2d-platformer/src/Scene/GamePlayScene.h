// ゲームプレイ画面シーン
// プレイヤー・敵・タイルマップ・カメラ・HUDを管理する
// Escキーでポーズ状態に切り替え、ポーズ中はメニューを表示する

#pragma once

#include <vector>
#include <memory>

#include "Scene/Scene.h"
#include "Entity/Player.h"
#include "Entity/Slime.h"
#include "Entity/Bat.h"
#include "Map/TileMap.h"
#include "Map/Camera.h"
#include "UI/HUD.h"

class GamePlayScene : public Scene {
public:
    GamePlayScene();
    void handleInput(const sf::Event& event) override;
    void update(float dt) override;
    void render(sf::RenderWindow& window) override;
    std::optional<SceneType> getNextScene() const override;

private:
    int stageId;                             // 現在のステージ番号
    Player player;                           // プレイヤーキャラクター
    TileMap tileMap;                         // タイルマップ（地形データ）
    Camera camera;                           // プレイヤー追従カメラ
    HUD hud;                                 // HP表示等のHUD

    // 敵の管理
    std::vector<std::unique_ptr<Slime>> slimes;
    std::vector<std::unique_ptr<Bat>> bats;

    // ゴール判定
    sf::FloatRect goalRect;
    sf::Vector2f spawnPoint;                 // プレイヤーの初期・リスポーン位置

    // パララックス背景（遠景・中景・近景）
    sf::Sprite bgFar;
    sf::Sprite bgMid;
    sf::Sprite bgNear;

    // ポーズ状態
    bool paused;
    int pauseSelectedIndex;
    static constexpr int PAUSE_RESUME       = 0;
    static constexpr int PAUSE_STAGE_SELECT = 1;
    static constexpr int PAUSE_MENU_COUNT   = 2;

    std::optional<SceneType> nextScene;      // 遷移先

    void spawnEnemies();                     // ステージに応じた敵の初期配置
    void updateCombat();                     // 攻撃判定・接触ダメージの処理
    void renderBackground(sf::RenderWindow& window); // パララックス背景を描画する
    void renderGoal(sf::RenderWindow& window);  // ゴールを描画する
    void renderPause(sf::RenderWindow& window); // ポーズメニューを描画する
};
