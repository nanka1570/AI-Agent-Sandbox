// 敵基底クラスの実装
// 共通処理（重力、ヒットストップ、描画）をここで行い、
// 行動パターンは派生クラスの updateAI() に委譲する

#include "Entity/Enemy.h"
#include "Map/TileMap.h"
#include "System/Collision.h"

Enemy::Enemy()
    : aiState(AIState::Patrol)
    , patrolRange(100.f)
    , attackDamage(1)
    , gravity(1000.f)
    , hitTimer(0.f)
{
    alive = true;
    facingRight = false;
}

// マップなし更新（Entity純粋仮想の実装）
void Enemy::update(float dt)
{
    position += velocity * dt;
}

// マップ衝突付きの更新
void Enemy::update(float dt, const TileMap& map)
{
    // 被ダメージ中はノックバックのみ
    if (aiState == AIState::Hit) {
        hitTimer -= dt;
        velocity.y += gravity * dt;
        if (hitTimer <= 0.f) {
            if (!alive) return;  // HPが0なら消滅
            aiState = AIState::Patrol;
        }
    }

    // 重力を適用（地上型の敵用、Batはオーバーライドで無効化）
    velocity.y += gravity * dt;

    // 衝突解決
    Collision::resolveMapCollision(*this, map, dt);
}

// スプライト描画（派生クラスでテクスチャとアニメーションを設定済み）
void Enemy::render(sf::RenderWindow& window)
{
    if (!alive) return;

    // 被ダメージ中は点滅
    if (aiState == AIState::Hit) {
        int blink = static_cast<int>(hitTimer * 20) % 2;
        if (blink == 0) return;
    }

    window.draw(enemySprite);
}

// ダメージ処理: ノックバック + ヒットストップ
void Enemy::takeDamage(int amount)
{
    if (aiState == AIState::Hit) return;
    Entity::takeDamage(amount);
    aiState = AIState::Hit;
    hitTimer = HIT_DURATION;
    // 小さなノックバック（上に跳ねる）
    velocity.y = -150.f;
}

bool Enemy::isInHitState() const
{
    return aiState == AIState::Hit;
}
