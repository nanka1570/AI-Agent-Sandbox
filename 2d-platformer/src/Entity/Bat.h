// コウモリ（設計書 §5.4, §13）
// 空中を上下に浮遊する飛行型の敵
// HP: 1, 移動速度: 100px/s, 接触ダメージ: 1

#pragma once

#include <map>

#include "Entity/Enemy.h"
#include "System/Animation.h"

class Bat : public Enemy {
public:
    Bat(float x, float y);
    void updateAI(float dt, const sf::Vector2f& playerPos) override;
    void update(float dt, const TileMap& map);
    void render(sf::RenderWindow& window) override;

private:
    float moveSpeed;       // 100 px/s（突進時）
    float hoverSpeed;      // 上下浮遊の速度
    float hoverRange;      // 浮遊の振幅
    float hoverTimer;      // 浮遊用の内部タイマー
    float detectionRange;  // プレイヤー検知範囲

    bool charging;         // 突進中フラグ
    sf::Vector2f chargeDir;// 突進方向

    // アニメーション状態
    enum class AnimState { Fly, Attack, Hit };
    AnimState animState;
    AnimState prevAnimState;
    std::map<AnimState, Animation> animations;

    void setupAnimations();
    void updateAnimation(float dt);

    static constexpr float BAT_WIDTH  = 20.f;
    static constexpr float BAT_HEIGHT = 16.f;
    static constexpr int CELL_W = 32;
    static constexpr int CELL_H = 32;
};
