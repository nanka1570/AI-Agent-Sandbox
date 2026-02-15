// タイトル画面シーン（設計書 §12.2）
// ゲームタイトルの表示と「はじめる」「おわる」メニュー
// 上下キーでカーソル移動、Spaceで決定

#pragma once

#include "Scene/Scene.h"

class TitleScene : public Scene {
public:
    TitleScene();
    void handleInput(const sf::Event& event) override;
    void update(float dt) override;
    void render(sf::RenderWindow& window) override;
    std::optional<SceneType> getNextScene() const override;

private:
    int selectedIndex = 0;                   // 選択中のメニュー項目
    std::optional<SceneType> nextScene;      // 遷移先

    // スプライト
    sf::Sprite logoSprite;
    sf::Sprite buttonSprites[2];             // はじめる・おわる
    sf::Sprite buttonHoverSprites[2];        // ホバー状態

    static constexpr int MENU_START = 0;     // はじめる
    static constexpr int MENU_QUIT  = 1;     // おわる
    static constexpr int MENU_COUNT = 2;
};
