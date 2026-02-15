// ゲーム全体を管理するクラス
// ウィンドウの生成、ゲームループの実行、シーン遷移を担当する

#pragma once

#include <memory>

#include <SFML/Graphics.hpp>

#include "Scene/Scene.h"

class Game {
public:
    Game();
    void run();  // メインのゲームループを実行する

private:
    void processEvents();             // ウィンドウイベント（閉じる、キー入力等）を処理する
    void update(float dt);            // ゲームロジックを更新し、シーン遷移をチェックする
    void render();                    // 現在のシーンを描画する
    void changeScene(SceneType type); // 指定されたシーンに切り替える

    sf::RenderWindow window;                // SFMLの描画ウィンドウ（1280x720）
    sf::View gameView;                      // 内部解像度用のビュー（640x360）
    std::unique_ptr<Scene> currentScene;    // 現在アクティブなシーン

    static constexpr float FIXED_DT = 1.0f / 60.0f;      // 固定タイムステップ（1/60秒）
    static constexpr float MAX_FRAME_TIME = 0.25f;        // フレーム時間の上限（暴走防止）
};
