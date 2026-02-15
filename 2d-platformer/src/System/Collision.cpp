// 当たり判定の実装
// resolveMapCollisionがこのプロジェクトの当たり判定の中核
// X軸とY軸を分けて処理することで、壁際や角での不自然なめり込みを防ぐ

#include "System/Collision.h"
#include "Entity/Entity.h"
#include "Map/TileMap.h"

bool Collision::intersects(const sf::FloatRect& a, const sf::FloatRect& b)
{
    return a.intersects(b);
}

// エンティティのマップ衝突を解決する
// 手順:
//   1. X軸方向に移動して、壁にめり込んだら押し戻す
//   2. Y軸方向に移動して、地面/天井にめり込んだら押し戻す
// X軸とY軸を分離することで、壁に沿ってスムーズに移動できる
bool Collision::resolveMapCollision(Entity& entity, const TileMap& map, float dt)
{
    sf::Vector2f pos = entity.getPosition();
    sf::Vector2f vel = entity.getVelocity();
    sf::FloatRect hb = entity.getHitbox();
    float w = hb.width;
    float h = hb.height;
    bool onGround = false;

    // --- X軸の移動と衝突解決 ---
    pos.x += vel.x * dt;

    // 移動後の位置で周辺の壁タイルを取得
    sf::FloatRect xRect(pos.x, pos.y, w, h);
    auto xTiles = map.getSolidTilesInRange(xRect);

    for (const auto& tile : xTiles) {
        if (!xRect.intersects(tile)) continue;

        if (vel.x > 0.f) {
            // 右に移動中 → タイルの左端に押し戻す
            pos.x = tile.left - w;
        } else if (vel.x < 0.f) {
            // 左に移動中 → タイルの右端に押し戻す
            pos.x = tile.left + tile.width;
        }
        vel.x = 0.f;
        xRect.left = pos.x;  // 補正後の位置で次のタイルもチェック
    }

    // --- Y軸の移動と衝突解決 ---
    pos.y += vel.y * dt;

    // X軸補正済みの位置で周辺の壁タイルを取得
    sf::FloatRect yRect(pos.x, pos.y, w, h);
    auto yTiles = map.getSolidTilesInRange(yRect);

    for (const auto& tile : yTiles) {
        if (!yRect.intersects(tile)) continue;

        if (vel.y > 0.f) {
            // 下に移動中（落下中）→ タイルの上端に押し戻す（着地）
            pos.y = tile.top - h;
            onGround = true;
        } else if (vel.y < 0.f) {
            // 上に移動中（ジャンプ中）→ タイルの下端に押し戻す（天井に頭をぶつけた）
            pos.y = tile.top + tile.height;
        }
        vel.y = 0.f;
        yRect.top = pos.y;  // 補正後の位置で次のタイルもチェック
    }

    // 補正後の位置と速度をエンティティに反映する
    entity.setPosition(pos);
    entity.setVelocity(vel);
    return onGround;
}

// エンティティ同士のAABB衝突判定
bool Collision::checkEntityCollision(const Entity& a, const Entity& b)
{
    return a.getHitbox().intersects(b.getHitbox());
}
