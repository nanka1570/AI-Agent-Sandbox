// アニメーションクラスの実装
// update()を毎フレーム呼ぶことでフレームが進む

#include "System/Animation.h"

Animation::Animation()
    : frameDuration(0.f)
    , elapsedTime(0.f)
    , currentFrame(0)
    , looping(true)
{
}

void Animation::setup(int row, int frameCount, int cellW, int cellH,
                      float totalDuration, bool loop)
{
    frames.clear();
    for (int i = 0; i < frameCount; ++i) {
        frames.emplace_back(i * cellW, row * cellH, cellW, cellH);
    }
    frameDuration = (frameCount > 0) ? totalDuration / static_cast<float>(frameCount) : 0.f;
    looping = loop;
    elapsedTime = 0.f;
    currentFrame = 0;
}

void Animation::update(float dt)
{
    if (frames.empty()) return;

    elapsedTime += dt;
    if (elapsedTime >= frameDuration) {
        elapsedTime -= frameDuration;
        ++currentFrame;

        if (currentFrame >= static_cast<int>(frames.size())) {
            if (looping) {
                currentFrame = 0;
            } else {
                currentFrame = static_cast<int>(frames.size()) - 1;
            }
        }
    }
}

void Animation::reset()
{
    currentFrame = 0;
    elapsedTime = 0.f;
}

sf::IntRect Animation::getCurrentRect() const
{
    if (frames.empty()) return sf::IntRect(0, 0, 0, 0);
    return frames[currentFrame];
}

bool Animation::isFinished() const
{
    if (looping) return false;
    return currentFrame >= static_cast<int>(frames.size()) - 1;
}
