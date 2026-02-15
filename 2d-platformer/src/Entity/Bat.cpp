// コウモリの実装
// ホバー型AI: 通常時は上下に浮遊、プレイヤーが近づくと突進する
// 重力の影響を受けない飛行型の敵

#include "Entity/Bat.h"
#include "Map/TileMap.h"
#include "System/Collision.h"
#include "System/ResourceManager.h"
#include <cmath>

Bat::Bat(float x, float y)
    : moveSpeed(100.f)
    , hoverSpeed(30.f)
    , hoverRange(24.f)
    , hoverTimer(0.f)
    , detectionRange(120.f)
    , charging(false)
    , chargeDir(0.f, 0.f)
    , animState(AnimState::Fly)
    , prevAnimState(AnimState::Fly)
{
    position = sf::Vector2f(x, y);
    spawnPoint = position;
    velocity = sf::Vector2f(0.f, 0.f);
    hitbox = sf::FloatRect(0.f, 0.f, BAT_WIDTH, BAT_HEIGHT);
    hp = 1;
    maxHp = 1;
    attackDamage = 1;
    gravity = 0.f;  // 飛行型なので重力なし

    // スプライトの初期化
    enemySprite.setTexture(ResourceManager::getTexture("assets/sprites/enemy_bat_sheet.png"));
    // ピボット点: 中心 (16, 16)
    enemySprite.setOrigin(CELL_W / 2.f, CELL_H / 2.f);
    setupAnimations();
}

void Bat::setupAnimations()
{
    // Row 0: Fly (4フレーム, ループ, 0.4s)
    animations[AnimState::Fly].setup(0, 4, CELL_W, CELL_H, 0.4f, true);
    // Row 1: Attack (2フレーム, 非ループ, 0.3s)
    animations[AnimState::Attack].setup(1, 2, CELL_W, CELL_H, 0.3f, false);
    // Row 2: Hit (1フレーム, 非ループ)
    animations[AnimState::Hit].setup(2, 1, CELL_W, CELL_H, 0.3f, false);
}

void Bat::updateAnimation(float dt)
{
    if (animState != prevAnimState) {
        animations[animState].reset();
        prevAnimState = animState;
    }
    animations[animState].update(dt);
}

// AI更新: 浮遊 + プレイヤー検知で突進
void Bat::updateAI(float dt, const sf::Vector2f& playerPos)
{
    if (aiState == AIState::Hit) return;

    // プレイヤーとの距離を計算
    float dx = playerPos.x - position.x;
    float dy = playerPos.y - position.y;
    float dist = std::sqrt(dx * dx + dy * dy);

    if (!charging && dist < detectionRange) {
        // プレイヤーを検知: 突進開始
        charging = true;
        // プレイヤー方向への正規化ベクトル
        chargeDir.x = dx / dist;
        chargeDir.y = dy / dist;
        velocity.x = chargeDir.x * moveSpeed;
        velocity.y = chargeDir.y * moveSpeed;
        facingRight = (dx > 0.f);
    } else if (!charging) {
        // 通常: 上下に浮遊
        hoverTimer += dt;
        float targetY = spawnPoint.y + std::sin(hoverTimer * 2.f) * hoverRange;
        velocity.y = (targetY - position.y) * 3.f;
        velocity.x = 0.f;
    }
    // 突進中は速度を維持（そのまま直進）
}

// マップ衝突付き更新
// ※ updateAI() は GamePlayScene から事前に呼ばれている前提
void Bat::update(float dt, const TileMap& map)
{
    if (!alive) return;

    // 被ダメージ中
    if (aiState == AIState::Hit) {
        hitTimer -= dt;
        // ノックバック（重力なしで少し跳ねる）
        velocity.y += 300.f * dt;  // 軽い落下
        position += velocity * dt;
        animState = AnimState::Hit;
        updateAnimation(dt);
        if (hitTimer <= 0.f) {
            if (!alive) return;
            aiState = AIState::Patrol;
            charging = false;
        }
        return;
    }

    // 飛行型: 単純に移動（マップ衝突なし）
    position += velocity * dt;

    // スポーン地点から大きく離れたら戻る（突進後の帰還）
    float dx = position.x - spawnPoint.x;
    float dy = position.y - spawnPoint.y;
    float dist = std::sqrt(dx * dx + dy * dy);
    if (charging && dist > detectionRange * 2.f) {
        charging = false;
        aiState = AIState::Patrol;
    }

    // アニメーション状態の更新
    animState = charging ? AnimState::Attack : AnimState::Fly;
    updateAnimation(dt);
}

// スプライト描画
void Bat::render(sf::RenderWindow& window)
{
    if (!alive) return;

    // 被ダメージ中は点滅
    if (aiState == AIState::Hit) {
        int blink = static_cast<int>(hitTimer * 20) % 2;
        if (blink == 0) return;
    }

    // アニメーションフレームをセット
    enemySprite.setTextureRect(animations[animState].getCurrentRect());

    // 中心にスプライトを配置
    float centerX = position.x + BAT_WIDTH / 2.f;
    float centerY = position.y + BAT_HEIGHT / 2.f;
    enemySprite.setPosition(centerX, centerY);

    // 向きに応じてスケール反転
    if (facingRight) {
        enemySprite.setScale(1.f, 1.f);
    } else {
        enemySprite.setScale(-1.f, 1.f);
    }

    window.draw(enemySprite);
}
