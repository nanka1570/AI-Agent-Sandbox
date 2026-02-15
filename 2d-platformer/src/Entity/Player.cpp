#include "Entity/Player.h"
#include "Map/TileMap.h"
#include "System/Collision.h"
#include "System/ResourceManager.h"

#include <iostream>

// --- コンストラクタ ---

Player::Player()
    : currentState(State::Idle), prevState(State::Idle)
    , moveSpeed(160.f), jumpForce(-400.f), gravity(1000.f), isOnGround(false)
    , attackDamage(1), attackDuration(0.3f), attackTimer(0.f)
    , dashSpeed(400.f), dashDuration(0.15f), dashCooldown(0.8f)
    , dashTimer(0.f), dashCooldownTimer(0.f)
    , isTouchingWall(false), touchingWallOnRight(false)
    , wallSlideSpeed(60.f), wallJumpTimer(0.f)
    , invincibleTime(1.0f), invincibleTimer(0.f)
{
    position = sf::Vector2f(64.f, 576.f);
    velocity = sf::Vector2f(0.f, 0.f);
    hitbox = sf::FloatRect(0.f, 0.f, PLAYER_WIDTH, PLAYER_HEIGHT);
    hp = 5;
    maxHp = 5;
    alive = true;
    facingRight = true;

    // スプライトの初期化
    playerSprite.setTexture(ResourceManager::getTexture("assets/sprites/player_sheet.png"));
    // ピボット点: 足元中央 (セル幅の半分, セル高さ)
    playerSprite.setOrigin(CELL_W / 2.f, static_cast<float>(CELL_H));
    setupAnimations();

    // デバッグ: スプライトシート情報をコンソール出力
    {
        auto texSize = playerSprite.getTexture()->getSize();
        std::cout << "[Player] Spritesheet size: "
                  << texSize.x << "x" << texSize.y << std::endl;
        std::cout << "[Player] Frame size: "
                  << CELL_W << "x" << CELL_H << std::endl;
        std::cout << "[Player] Grid: "
                  << texSize.x / CELL_W << " cols x "
                  << texSize.y / CELL_H << " rows" << std::endl;
        std::cout << "[Player] Hitbox: "
                  << PLAYER_WIDTH << "x" << PLAYER_HEIGHT << std::endl;
        std::cout << "[Player] Origin: ("
                  << CELL_W / 2 << ", " << CELL_H << ")" << std::endl;
    }
}

// --- アニメーション設定 ---
// スプライトシートの各行に対応するアニメーションを登録する

void Player::setupAnimations()
{
    // Row 0: Idle (1フレーム, 静止)
    animations[State::Idle].setup(0, 1, CELL_W, CELL_H, 1.0f, false);
    // Row 1: Running (6フレーム, ループ, 0.6s)
    animations[State::Running].setup(1, 6, CELL_W, CELL_H, 0.6f, true);
    // Row 2: Jumping (2フレーム, 非ループ)
    animations[State::Jumping].setup(2, 2, CELL_W, CELL_H, 0.4f, false);
    // Row 3: Falling (2フレーム, ループ, 0.4s)
    animations[State::Falling].setup(3, 2, CELL_W, CELL_H, 0.4f, true);
    // Row 4: Attacking (4フレーム, 非ループ, 0.3s)
    animations[State::Attacking].setup(4, 4, CELL_W, CELL_H, 0.3f, false);
    // Row 5: Dashing (2フレーム, ループ, 0.2s)
    animations[State::Dashing].setup(5, 2, CELL_W, CELL_H, 0.2f, true);
    // Row 6: WallSlide (2フレーム, ループ, 0.4s)
    animations[State::WallSlide].setup(6, 2, CELL_W, CELL_H, 0.4f, true);
    // Row 7: Hit (1フレーム, 非ループ)
    animations[State::Hit].setup(7, 1, CELL_W, CELL_H, 0.5f, false);
    // WallJump は Jumping のアニメーションを共用
    animations[State::WallJump].setup(2, 2, CELL_W, CELL_H, 0.4f, false);

    // デバッグ: 各アクションのフレーム数を出力
    std::cout << "[Player] Animation frames:" << std::endl;
    std::cout << "  Idle:      row=0, frames=1" << std::endl;
    std::cout << "  Running:   row=1, frames=6" << std::endl;
    std::cout << "  Jumping:   row=2, frames=2" << std::endl;
    std::cout << "  Falling:   row=3, frames=2" << std::endl;
    std::cout << "  Attacking: row=4, frames=4" << std::endl;
    std::cout << "  Dashing:   row=5, frames=2" << std::endl;
    std::cout << "  WallSlide: row=6, frames=2" << std::endl;
    std::cout << "  Hit:       row=7, frames=1" << std::endl;
    std::cout << "  WallJump:  row=2, frames=2 (shared with Jumping)" << std::endl;
}

// --- アニメーション更新 ---
void Player::updateAnimation(float dt)
{
    // 状態が変わったらアニメーションをリセット
    if (currentState != prevState) {
        animations[currentState].reset();
        prevState = currentState;
    }
    animations[currentState].update(dt);
}

// --- 入力処理 ---

void Player::handleInput(const sf::Event& event)
{
    if (event.type != sf::Event::KeyPressed) return;
    auto key = event.key.code;

    if (key == sf::Keyboard::Space) {
        if (currentState == State::WallSlide) {
            startWallJump();
        } else if (isOnGround &&
                   currentState != State::Dashing &&
                   currentState != State::Attacking) {
            velocity.y = jumpForce;
            isOnGround = false;
        }
    }

    if (key == sf::Keyboard::Z || key == sf::Keyboard::J) {
        if (currentState != State::Attacking &&
            currentState != State::Dashing &&
            currentState != State::WallJump &&
            currentState != State::Hit) {
            startAttack();
        }
    }

    if (key == sf::Keyboard::LShift || key == sf::Keyboard::L) {
        if (currentState != State::Dashing &&
            currentState != State::WallJump &&
            currentState != State::Hit &&
            dashCooldownTimer <= 0.f) {
            startDash();
        }
    }
}

// --- 共通の移動処理 ---

void Player::handleMovement(float dt)
{
    velocity.x = 0.f;
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::A) ||
        sf::Keyboard::isKeyPressed(sf::Keyboard::Left)) {
        velocity.x = -moveSpeed;
        facingRight = false;
    }
    if (sf::Keyboard::isKeyPressed(sf::Keyboard::D) ||
        sf::Keyboard::isKeyPressed(sf::Keyboard::Right)) {
        velocity.x = moveSpeed;
        facingRight = true;
    }
    velocity.y += gravity * dt;
}

// --- マップなし更新 ---

void Player::update(float dt)
{
    handleMovement(dt);
    position += velocity * dt;
    updateState();
    updateAnimation(dt);
}

// --- マップ衝突付きメイン更新 ---

void Player::update(float dt, const TileMap& map)
{
    if (dashCooldownTimer > 0.f) dashCooldownTimer -= dt;
    if (invincibleTimer > 0.f) invincibleTimer -= dt;

    switch (currentState) {
    case State::Dashing:
        dashTimer -= dt;
        if (dashTimer <= 0.f) {
            currentState = isOnGround ? State::Idle : State::Falling;
        }
        break;

    case State::Attacking:
        attackTimer -= dt;
        velocity.x = 0.f;
        velocity.y += gravity * dt;
        if (attackTimer <= 0.f) {
            currentState = isOnGround ? State::Idle : State::Falling;
        }
        break;

    case State::WallSlide:
        velocity.x = 0.f;
        velocity.y = wallSlideSpeed;
        break;

    case State::WallJump:
        wallJumpTimer -= dt;
        velocity.y += gravity * dt;
        if (wallJumpTimer <= 0.f) {
            currentState = (velocity.y < 0.f) ? State::Jumping : State::Falling;
        }
        break;

    case State::Hit:
        velocity.y += gravity * dt;
        if (invincibleTimer < invincibleTime - 0.2f) {
            currentState = isOnGround ? State::Idle : State::Falling;
        }
        break;

    default:
        handleMovement(dt);
        break;
    }

    isOnGround = Collision::resolveMapCollision(*this, map, dt);
    checkWallContact(map);

    if (currentState != State::Dashing &&
        currentState != State::Attacking &&
        currentState != State::WallJump &&
        currentState != State::Hit) {
        updateState();
    }

    updateAnimation(dt);
}

// --- 描画 ---

void Player::render(sf::RenderWindow& window)
{
    // 無敵中は点滅
    if (invincibleTimer > 0.f) {
        int blink = static_cast<int>(invincibleTimer * 10) % 2;
        if (blink == 0) return;
    }

    // アニメーションフレームをセット
    playerSprite.setTextureRect(animations[currentState].getCurrentRect());

    // 足元中央にスプライトを配置
    float footX = position.x + PLAYER_WIDTH / 2.f;
    float footY = position.y + PLAYER_HEIGHT;
    playerSprite.setPosition(footX, footY);

    // 向きに応じてスケール反転
    if (facingRight) {
        playerSprite.setScale(1.f, 1.f);
    } else {
        playerSprite.setScale(-1.f, 1.f);
    }

    window.draw(playerSprite);
}

// --- ダメージ処理 ---

void Player::takeDamage(int amount)
{
    if (invincibleTimer > 0.f || currentState == State::Dashing) return;
    Entity::takeDamage(amount);
    invincibleTimer = invincibleTime;
    currentState = State::Hit;
    velocity.y = -200.f;
    velocity.x = facingRight ? -100.f : 100.f;
}

// --- アクション開始 ---

void Player::startAttack()
{
    currentState = State::Attacking;
    attackTimer = attackDuration;
    velocity.x = 0.f;
}

void Player::startDash()
{
    currentState = State::Dashing;
    dashTimer = dashDuration;
    dashCooldownTimer = dashCooldown;
    velocity.x = facingRight ? dashSpeed : -dashSpeed;
    velocity.y = 0.f;
}

void Player::startWallJump()
{
    currentState = State::WallJump;
    velocity.y = jumpForce;
    velocity.x = touchingWallOnRight ? -moveSpeed : moveSpeed;
    facingRight = !touchingWallOnRight;
    wallJumpTimer = WALL_JUMP_LOCK_TIME;
    isOnGround = false;
    isTouchingWall = false;
}

// --- 壁接触判定 ---

void Player::checkWallContact(const TileMap& map)
{
    isTouchingWall = false;
    touchingWallOnRight = false;

    if (isOnGround || currentState == State::Dashing) return;

    float shrink = 2.f;

    sf::FloatRect rightCheck(
        position.x + PLAYER_WIDTH, position.y + shrink,
        1.f, PLAYER_HEIGHT - shrink * 2.f);
    for (const auto& t : map.getSolidTilesInRange(rightCheck)) {
        if (rightCheck.intersects(t)) {
            isTouchingWall = true;
            touchingWallOnRight = true;
            return;
        }
    }

    sf::FloatRect leftCheck(
        position.x - 1.f, position.y + shrink,
        1.f, PLAYER_HEIGHT - shrink * 2.f);
    for (const auto& t : map.getSolidTilesInRange(leftCheck)) {
        if (leftCheck.intersects(t)) {
            isTouchingWall = true;
            return;
        }
    }
}

// --- 状態判定 ---

void Player::updateState()
{
    if (isOnGround) {
        currentState = (velocity.x != 0.f) ? State::Running : State::Idle;
    } else if (isTouchingWall && velocity.y > 0.f) {
        bool pressingToward =
            (touchingWallOnRight &&
             (sf::Keyboard::isKeyPressed(sf::Keyboard::D) ||
              sf::Keyboard::isKeyPressed(sf::Keyboard::Right))) ||
            (!touchingWallOnRight &&
             (sf::Keyboard::isKeyPressed(sf::Keyboard::A) ||
              sf::Keyboard::isKeyPressed(sf::Keyboard::Left)));
        currentState = pressingToward ? State::WallSlide : State::Falling;
    } else {
        currentState = (velocity.y < 0.f) ? State::Jumping : State::Falling;
    }
}

// --- 外部インターフェース ---

bool Player::getIsAttacking() const
{
    return currentState == State::Attacking && attackTimer > 0.f;
}

sf::FloatRect Player::getAttackHitbox() const
{
    float ax = facingRight ? position.x + PLAYER_WIDTH : position.x - ATTACK_WIDTH;
    float ay = position.y + (PLAYER_HEIGHT - ATTACK_HEIGHT) / 2.f;
    return sf::FloatRect(ax, ay, ATTACK_WIDTH, ATTACK_HEIGHT);
}

bool Player::isInvincible() const
{
    return invincibleTimer > 0.f || currentState == State::Dashing;
}
