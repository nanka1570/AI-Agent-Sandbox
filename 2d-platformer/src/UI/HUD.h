// HUD（ヘッドアップディスプレイ）（設計書 §12.1）
// 画面上部にHP（ハートアイコン）とステージ名を表示する
// カメラに追従しない画面固定の表示

#pragma once

#include <SFML/Graphics.hpp>

class HUD {
public:
    HUD();

    // HPとステージ名を更新して描画する
    void render(sf::RenderWindow& window, int currentHp, int maxHp);

private:
    sf::View hudView;  // HUD専用のビュー（画面固定）

    // ハートスプライト
    sf::Sprite heartFullSprite;
    sf::Sprite heartEmptySprite;

    // ハートの描画パラメータ
    static constexpr float HEART_SIZE   = 16.f;
    static constexpr float HEART_MARGIN = 3.f;
    static constexpr float HUD_PADDING  = 8.f;
};
