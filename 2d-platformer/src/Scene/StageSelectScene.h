// ステージ選択画面シーン（設計書 §12.3）
// 3ステージから選択し、Spaceで決定する
// 左右キーでステージを切り替え、Escでタイトルに戻る

#pragma once

#include "Scene/Scene.h"

class StageSelectScene : public Scene {
public:
    StageSelectScene();
    void handleInput(const sf::Event& event) override;
    void update(float dt) override;
    void render(sf::RenderWindow& window) override;
    std::optional<SceneType> getNextScene() const override;

private:
    int selectedStage;                       // 選択中のステージ（0-based index）
    std::optional<SceneType> nextScene;

    // ステージフレームスプライト
    sf::Sprite stageFrameSprites[3];

    static constexpr int STAGE_COUNT = 3;
};
