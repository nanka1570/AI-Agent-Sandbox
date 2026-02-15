// 敵基底クラス（設計書 §5.4）
// Slime, Batの共通機能（AI状態管理、マップ衝突付き更新）を定義する
// 各敵タイプは updateAI() をオーバーライドして固有の行動を実装する

#pragma once

#include <SFML/Graphics.hpp>

#include "Entity/Entity.h"

class TileMap;

class Enemy : public Entity {
public:
    Enemy();
    virtual ~Enemy() = default;

    void update(float dt) override;
    void update(float dt, const TileMap& map);
    void render(sf::RenderWindow& window) override;
    void takeDamage(int amount) override;

    // AI更新（派生クラスで行動パターンを実装する）
    virtual void updateAI(float dt, const sf::Vector2f& playerPos) = 0;

    // 被ダメージ時の短いヒットストップ中かどうか
    bool isInHitState() const;

protected:
    enum class AIState { Patrol, Chase, Hit };
    AIState aiState;

    sf::Vector2f spawnPoint;    // 初期配置位置
    float patrolRange;          // 巡回範囲（スポーン地点からの距離）
    int attackDamage;           // 接触ダメージ量
    float gravity;              // 重力加速度

    // 被ダメージ時のノックバック管理
    float hitTimer;
    static constexpr float HIT_DURATION = 0.3f;

    // スプライト（派生クラスでテクスチャとオリジンを設定する）
    sf::Sprite enemySprite;
};
