// リザルト画面シーン（設計書 §12.4）
// ステージクリアまたはゲームオーバー時に表示される
// メニューで「ステージ選択に戻る」「タイトルに戻る」を選択できる

#pragma once

#include "Scene/Scene.h"

class ResultScene : public Scene {
public:
    explicit ResultScene(bool cleared);
    void handleInput(const sf::Event& event) override;
    void update(float dt) override;
    void render(sf::RenderWindow& window) override;
    std::optional<SceneType> getNextScene() const override;

private:
    bool isCleared;                      // クリアかゲームオーバーか
    int selectedIndex;                   // 現在選択中のメニュー項目
    std::optional<SceneType> nextScene;  // 遷移先

    // テキストスプライト
    sf::Sprite resultTextSprite;

    // ボタンスプライト
    sf::Sprite buttonSprites[2];
    sf::Sprite buttonHoverSprites[2];

    static constexpr int MENU_STAGE_SELECT = 0;
    static constexpr int MENU_TITLE        = 1;
    static constexpr int MENU_COUNT        = 2;
};
