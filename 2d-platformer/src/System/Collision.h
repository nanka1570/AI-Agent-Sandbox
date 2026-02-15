// 当たり判定ユーティリティ（設計書 §7）
// AABB方式でX軸・Y軸を分離して判定・解決する

#pragma once

#include <SFML/Graphics.hpp>

class Entity;
class TileMap;

namespace Collision {
    // AABB同士の重なり判定
    bool intersects(const sf::FloatRect& a, const sf::FloatRect& b);

    // エンティティとタイルマップの衝突を解決する
    // X軸の移動→衝突解決、Y軸の移動→衝突解決の順で処理する
    // 戻り値: エンティティが地面に接地していればtrue
    bool resolveMapCollision(Entity& entity, const TileMap& map, float dt);

    // エンティティ同士の衝突判定（攻撃判定等に使用）
    bool checkEntityCollision(const Entity& a, const Entity& b);
}
