// シーン基底クラスとシーン種別の定義
// すべてのシーン（タイトル、ゲームプレイ等）はこのクラスを継承する

#pragma once

#include <optional>

#include <SFML/Graphics.hpp>

// シーンの種類を表す列挙型
enum class SceneType {
    Title,          // タイトル画面
    StageSelect,    // ステージ選択画面
    GamePlay,       // ゲームプレイ画面
    ResultClear,    // リザルト画面（クリア）
    ResultGameOver, // リザルト画面（ゲームオーバー）
    Quit            // ゲーム終了
};

// シーン基底クラス（純粋仮想クラス）
// 各シーンはこの4つのメソッドを必ず実装する
class Scene {
public:
    virtual ~Scene() = default;
    virtual void handleInput(const sf::Event& event) = 0;           // イベント入力処理
    virtual void update(float dt) = 0;                              // ゲームロジック更新
    virtual void render(sf::RenderWindow& window) = 0;              // 描画
    virtual std::optional<SceneType> getNextScene() const = 0;      // 遷移先のシーン（なければnullopt）
};
