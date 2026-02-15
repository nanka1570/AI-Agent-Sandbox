// スライムの実装
// 巡回型AI: スポーン地点を中心に左右に往復移動する
// 壁にぶつかるか巡回範囲の端に到達したら反転する

#include "Entity/Slime.h"
#include "Map/TileMap.h"
#include "System/Collision.h"
#include "System/ResourceManager.h"

Slime::Slime(float x, float y)
    : moveSpeed(60.f)
    , animState(AnimState::Idle)
    , prevAnimState(AnimState::Idle)
{
    position = sf::Vector2f(x, y);
    spawnPoint = position;
    velocity = sf::Vector2f(0.f, 0.f);
    hitbox = sf::FloatRect(0.f, 0.f, SLIME_WIDTH, SLIME_HEIGHT);
    hp = 2;
    maxHp = 2;
    patrolRange = 80.f;
    attackDamage = 1;

    // スプライトの初期化
    enemySprite.setTexture(ResourceManager::getTexture("assets/sprites/enemy_slime_sheet.png"));
    // ピボット点: 足元中央 (16, 32)
    enemySprite.setOrigin(CELL_W / 2.f, static_cast<float>(CELL_H));
    setupAnimations();
}

void Slime::setupAnimations()
{
    // Row 0: Idle (1フレーム, 静止)
    animations[AnimState::Idle].setup(0, 1, CELL_W, CELL_H, 1.0f, false);
    // Row 1: Move (4フレーム, ループ, 0.6s)
    animations[AnimState::Move].setup(1, 4, CELL_W, CELL_H, 0.6f, true);
    // Row 2: Hit (1フレーム, 非ループ)
    animations[AnimState::Hit].setup(2, 1, CELL_W, CELL_H, 0.3f, false);
}

void Slime::updateAnimation(float dt)
{
    // 状態が変わったらアニメーションをリセット
    if (animState != prevAnimState) {
        animations[animState].reset();
        prevAnimState = animState;
    }
    animations[animState].update(dt);
}

// AI更新: 左右巡回
void Slime::updateAI(float dt, const sf::Vector2f& playerPos)
{
    if (aiState == AIState::Hit) return;

    // 巡回: 左右に移動、範囲外で反転
    velocity.x = facingRight ? moveSpeed : -moveSpeed;

    // 巡回範囲の端で反転
    if (position.x > spawnPoint.x + patrolRange) {
        facingRight = false;
    } else if (position.x < spawnPoint.x - patrolRange) {
        facingRight = true;
    }
}

// マップ衝突付き更新
// ※ updateAI() は GamePlayScene から事前に呼ばれている前提
void Slime::update(float dt, const TileMap& map)
{
    if (!alive) return;

    // 被ダメージ中のノックバック処理
    if (aiState == AIState::Hit) {
        hitTimer -= dt;
        velocity.y += gravity * dt;
        Collision::resolveMapCollision(*this, map, dt);
        animState = AnimState::Hit;
        updateAnimation(dt);
        if (hitTimer <= 0.f) {
            if (!alive) return;
            aiState = AIState::Patrol;
        }
        return;
    }

    // 重力
    velocity.y += gravity * dt;

    // 移動前のX位置を保存（壁で反転判定に使用）
    float prevX = position.x;

    // 衝突解決
    Collision::resolveMapCollision(*this, map, dt);

    // 壁にぶつかったら反転（X位置が変わらなかった場合）
    if (velocity.x == 0.f && prevX == position.x && aiState == AIState::Patrol) {
        facingRight = !facingRight;
    }

    // 足元に地面がなければ反転（落下防止）
    float checkX = facingRight ? position.x + SLIME_WIDTH + 2.f : position.x - 2.f;
    float checkY = position.y + SLIME_HEIGHT + 2.f;
    int tileX = static_cast<int>(checkX) / map.getTileSize();
    int tileY = static_cast<int>(checkY) / map.getTileSize();
    if (!map.isSolid(tileX, tileY)) {
        facingRight = !facingRight;
    }

    // アニメーション状態の更新
    animState = (velocity.x != 0.f) ? AnimState::Move : AnimState::Idle;
    updateAnimation(dt);
}

// スプライト描画
void Slime::render(sf::RenderWindow& window)
{
    if (!alive) return;

    // 被ダメージ中は点滅
    if (aiState == AIState::Hit) {
        int blink = static_cast<int>(hitTimer * 20) % 2;
        if (blink == 0) return;
    }

    // アニメーションフレームをセット
    enemySprite.setTextureRect(animations[animState].getCurrentRect());

    // 足元中央にスプライトを配置
    float footX = position.x + SLIME_WIDTH / 2.f;
    float footY = position.y + SLIME_HEIGHT;
    enemySprite.setPosition(footX, footY);

    // 向きに応じてスケール反転
    if (facingRight) {
        enemySprite.setScale(1.f, 1.f);
    } else {
        enemySprite.setScale(-1.f, 1.f);
    }

    window.draw(enemySprite);
}
