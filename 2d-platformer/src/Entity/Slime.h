// スライム（設計書 §5.4, §13）
// 地上を左右に巡回する基本的な敵
// HP: 2, 移動速度: 60px/s, 接触ダメージ: 1

#pragma once

#include <map>

#include "Entity/Enemy.h"
#include "System/Animation.h"

class Slime : public Enemy {
public:
    Slime(float x, float y);
    void updateAI(float dt, const sf::Vector2f& playerPos) override;
    void update(float dt, const TileMap& map);
    void render(sf::RenderWindow& window) override;

private:
    float moveSpeed;  // 60 px/s

    // アニメーション状態
    enum class AnimState { Idle, Move, Hit };
    AnimState animState;
    AnimState prevAnimState;
    std::map<AnimState, Animation> animations;

    void setupAnimations();
    void updateAnimation(float dt);

    static constexpr float SLIME_WIDTH  = 24.f;
    static constexpr float SLIME_HEIGHT = 20.f;
    static constexpr int CELL_W = 32;
    static constexpr int CELL_H = 32;
};
