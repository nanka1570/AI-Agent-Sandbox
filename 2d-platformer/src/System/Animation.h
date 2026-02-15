// アニメーションクラス（設計書 §11）
// スプライトシートからフレームを読み込み、時間経過でアニメーション再生する
// 1アクション = 1行（左→右にフレームが並ぶ）

#pragma once

#include <vector>

#include <SFML/Graphics.hpp>

class Animation {
public:
    Animation();

    // スプライトシートの1行からアニメーションを構築する
    // row: 行番号, frameCount: フレーム数, cellW/cellH: 1セルのサイズ
    // totalDuration: アニメーション全体の秒数, loop: ループするか
    void setup(int row, int frameCount, int cellW, int cellH,
               float totalDuration, bool loop);

    void update(float dt);
    void reset();

    sf::IntRect getCurrentRect() const;
    bool isFinished() const;

private:
    std::vector<sf::IntRect> frames;
    float frameDuration;   // 1フレームあたりの秒数
    float elapsedTime;
    int currentFrame;
    bool looping;
};
