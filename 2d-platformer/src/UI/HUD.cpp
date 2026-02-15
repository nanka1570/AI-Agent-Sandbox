// HUDの実装
// 画面固定のビューに切り替えてからHUD要素を描画し、元のビューに戻す
// ハートスプライト（ui_heart_full / ui_heart_empty）で残HPを表示する

#include "UI/HUD.h"
#include "System/ResourceManager.h"

HUD::HUD()
    : hudView(sf::FloatRect(0.f, 0.f, 640.f, 360.f))
{
    heartFullSprite.setTexture(ResourceManager::getTexture("assets/sprites/ui/ui_heart_full.png"));
    heartEmptySprite.setTexture(ResourceManager::getTexture("assets/sprites/ui/ui_heart_empty.png"));

    // ハートを 16x16 で表示するためのスケール（元画像は 32x32）
    float scale = HEART_SIZE / 32.f;
    heartFullSprite.setScale(scale, scale);
    heartEmptySprite.setScale(scale, scale);
}

void HUD::render(sf::RenderWindow& window, int currentHp, int maxHp)
{
    // 現在のカメラビューを保存してHUD用ビューに切り替え
    sf::View prevView = window.getView();
    window.setView(hudView);

    // HP半透明の背景バー
    float barWidth = maxHp * (HEART_SIZE + HEART_MARGIN) + HUD_PADDING;
    sf::RectangleShape bgBar(sf::Vector2f(barWidth, HEART_SIZE + HUD_PADDING));
    bgBar.setPosition(HUD_PADDING - 2.f, HUD_PADDING - 2.f);
    bgBar.setFillColor(sf::Color(0, 0, 0, 100));
    window.draw(bgBar);

    // ハートを並べて描画
    for (int i = 0; i < maxHp; ++i) {
        float x = HUD_PADDING + i * (HEART_SIZE + HEART_MARGIN);
        float y = HUD_PADDING;

        if (i < currentHp) {
            heartFullSprite.setPosition(x, y);
            window.draw(heartFullSprite);
        } else {
            heartEmptySprite.setPosition(x, y);
            window.draw(heartEmptySprite);
        }
    }

    // 元のビューに戻す
    window.setView(prevView);
}
