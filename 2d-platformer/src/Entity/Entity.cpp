#include "Entity/Entity.h"

// スプライトを現在位置に合わせて描画する（デフォルト実装）
// Playerは仮の矩形を描画するためオーバーライドしている
void Entity::render(sf::RenderWindow& window)
{
    sprite.setPosition(position);
    window.draw(sprite);
}

// --- 位置・速度のアクセサ ---
// 当たり判定システム（Collision::resolveMapCollision）がエンティティの
// 位置と速度を読み書きするために使う

sf::Vector2f Entity::getPosition() const { return position; }
void Entity::setPosition(const sf::Vector2f& pos) { position = pos; }
sf::Vector2f Entity::getVelocity() const { return velocity; }
void Entity::setVelocity(const sf::Vector2f& vel) { velocity = vel; }

// 現在のpositionとhitboxサイズから、ワールド座標上の当たり判定矩形を返す
sf::FloatRect Entity::getHitbox() const
{
    return sf::FloatRect(position.x, position.y, hitbox.width, hitbox.height);
}

// 指定量のダメージを受ける。HPが0以下になったら死亡扱いにする
void Entity::takeDamage(int amount)
{
    if (!alive) return;
    hp -= amount;
    if (hp <= 0) {
        hp = 0;
        alive = false;
    }
}

bool Entity::isAlive() const { return alive; }
int Entity::getHp() const { return hp; }
int Entity::getMaxHp() const { return maxHp; }
