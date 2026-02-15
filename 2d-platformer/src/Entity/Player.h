// プレイヤークラス
// 移動・ジャンプ・攻撃・ダッシュ・壁ジャンプを実装する
// スプライトシート player_sheet.png (48x48セル, 6列×8行) でアニメーション表示

#pragma once

#include <map>

#include <SFML/Graphics.hpp>

#include "Entity/Entity.h"
#include "System/Animation.h"

class TileMap;

class Player : public Entity {
public:
    Player();
    void handleInput(const sf::Event& event);
    void update(float dt) override;
    void update(float dt, const TileMap& map);
    void render(sf::RenderWindow& window) override;
    void takeDamage(int amount) override;

    bool getIsAttacking() const;
    sf::FloatRect getAttackHitbox() const;
    bool isInvincible() const;

    // プレイヤーの全状態
    enum class State {
        Idle, Running, Jumping, Falling,
        WallSlide, WallJump, Attacking, Dashing, Hit
    };

private:
    State currentState;
    State prevState;  // アニメーション切り替え検出用

    // --- 移動パラメータ（§13） ---
    float moveSpeed;
    float jumpForce;
    float gravity;
    bool isOnGround;

    // --- 攻撃パラメータ ---
    int attackDamage;
    float attackDuration;
    float attackTimer;

    // --- ダッシュパラメータ ---
    float dashSpeed;
    float dashDuration;
    float dashCooldown;
    float dashTimer;
    float dashCooldownTimer;

    // --- 壁ジャンプパラメータ ---
    bool isTouchingWall;
    bool touchingWallOnRight;
    float wallSlideSpeed;
    float wallJumpTimer;

    // --- 無敵時間 ---
    float invincibleTime;
    float invincibleTimer;

    // --- スプライト・アニメーション ---
    sf::Sprite playerSprite;
    std::map<State, Animation> animations;
    void setupAnimations();
    void updateAnimation(float dt);

    // 内部メソッド
    void handleMovement(float dt);
    void updateState();
    void checkWallContact(const TileMap& map);
    void startAttack();
    void startDash();
    void startWallJump();

    static constexpr float PLAYER_WIDTH  = 24.f;
    static constexpr float PLAYER_HEIGHT = 32.f;
    static constexpr float ATTACK_WIDTH  = 20.f;
    static constexpr float ATTACK_HEIGHT = 20.f;
    static constexpr float WALL_JUMP_LOCK_TIME = 0.15f;

    // スプライトシートのセルサイズ
    static constexpr int CELL_W = 48;
    static constexpr int CELL_H = 48;
};
