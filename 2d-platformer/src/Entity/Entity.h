// エンティティ基底クラス
// プレイヤーや敵の共通データ（位置、速度、HP等）とメソッドを定義する
// Player, Enemyはこのクラスを継承して実装する

#pragma once

#include <SFML/Graphics.hpp>

class Entity {
protected:
    sf::Vector2f position;       // ワールド座標上の位置
    sf::Vector2f velocity;       // 現在の速度（px/s）
    sf::FloatRect hitbox;        // 当たり判定の矩形サイズ
    int hp;                      // 現在のHP
    int maxHp;                   // 最大HP
    bool alive;                  // 生存フラグ
    bool facingRight;            // 右向きかどうか

public:
    virtual ~Entity() = default;
    virtual void update(float dt) = 0;                    // 毎フレームの更新処理（派生クラスで実装）
    virtual void render(sf::RenderWindow& window);         // スプライトを描画する（デフォルト実装）

    // 位置・速度のアクセサ（当たり判定システムから使用する）
    sf::Vector2f getPosition() const;
    void setPosition(const sf::Vector2f& pos);
    sf::Vector2f getVelocity() const;
    void setVelocity(const sf::Vector2f& vel);

    sf::FloatRect getHitbox() const;                       // 現在位置を反映した当たり判定矩形を返す
    virtual void takeDamage(int amount);                   // ダメージを受けてHPを減らす（派生クラスで拡張可能）
    int getHp() const;                                     // 現在のHPを返す
    int getMaxHp() const;                                  // 最大HPを返す
    bool isAlive() const;                                  // 生存しているかを返す
};
