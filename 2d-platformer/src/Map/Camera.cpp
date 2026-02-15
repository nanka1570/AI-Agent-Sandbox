// カメラの実装
// 線形補間でプレイヤーに滑らかに追従し、マップ端ではクランプする

#include "Map/Camera.h"

#include <algorithm>

Camera::Camera()
    : view(sf::FloatRect(0.f, 0.f, 640.f, 360.f))  // 内部解像度サイズのビュー
    , smoothSpeed(0.1f)                               // 毎フレーム10%ずつ追従
    , bounds(0.f, 0.f, 640.f, 360.f)                  // デフォルトはビューと同じ
{
}

// マップのピクセルサイズを設定する（カメラの移動範囲に使う）
void Camera::setBounds(float mapWidth, float mapHeight)
{
    bounds = sf::FloatRect(0.f, 0.f, mapWidth, mapHeight);
}

// プレイヤー位置に向かって滑らかに追従する
// center += (target - center) * smoothSpeed で線形補間する
// マップ端ではカメラがはみ出さないようクランプする
void Camera::update(const sf::Vector2f& targetPos)
{
    sf::Vector2f center = view.getCenter();

    // 線形補間: 現在位置からターゲットに向かってsmoothSpeed分だけ近づく
    center += (targetPos - center) * smoothSpeed;

    // マップ端でのクランプ処理
    // カメラの中心がビューの半分より内側に収まるよう制限する
    float halfW = view.getSize().x / 2.f;
    float halfH = view.getSize().y / 2.f;

    if (bounds.width > view.getSize().x) {
        center.x = std::clamp(center.x, halfW, bounds.width - halfW);
    } else {
        // マップがビューより小さい場合はマップの中央に固定
        center.x = bounds.width / 2.f;
    }

    if (bounds.height > view.getSize().y) {
        center.y = std::clamp(center.y, halfH, bounds.height - halfH);
    } else {
        center.y = bounds.height / 2.f;
    }

    view.setCenter(center);
}

// ウィンドウにこのカメラのビューを設定する
void Camera::applyTo(sf::RenderWindow& window) const
{
    window.setView(view);
}

sf::View Camera::getView() const
{
    return view;
}
