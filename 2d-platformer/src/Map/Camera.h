// カメラクラス（設計書 §8）
// プレイヤーに追従するスムーズスクロールと、マップ端のクランプ処理を行う

#pragma once

#include <SFML/Graphics.hpp>

class Camera {
public:
    Camera();
    void setBounds(float mapWidth, float mapHeight);  // マップサイズからカメラの移動範囲を設定
    void update(const sf::Vector2f& targetPos);        // ターゲット（プレイヤー）に向かって追従
    void applyTo(sf::RenderWindow& window) const;      // ウィンドウにこのカメラのビューを適用する
    sf::View getView() const;

private:
    sf::View view;            // 内部解像度（640x360）のビュー
    float smoothSpeed;        // 追従の滑らかさ（0.0〜1.0、大きいほど素早く追従）
    sf::FloatRect bounds;     // マップの範囲（カメラがはみ出さないよう制限する）
};
