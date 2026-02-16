// ステージ選択画面の実装
// 3つのステージをフレーム画像で横並びに表示する
// 左右キーで選択、Spaceで決定、Escでタイトルへ戻る

#include "Scene/StageSelectScene.h"
#include "System/AudioManager.h"
#include "System/ResourceManager.h"
#include "GameData.h"

StageSelectScene::StageSelectScene()
    : selectedStage(GameData::currentStage - 1)  // 前回のステージを初期選択
{
    // タイトルBGMを継続（同じファイルなら再起動しない）
    AudioManager::playBGM("assets/audio/bgm/title.ogg");
    // ステージフレーム画像（128x128）を読み込む
    stageFrameSprites[0].setTexture(ResourceManager::getTexture("assets/sprites/ui/ui_stage_frame_1.png"));
    stageFrameSprites[1].setTexture(ResourceManager::getTexture("assets/sprites/ui/ui_stage_frame_2.png"));
    stageFrameSprites[2].setTexture(ResourceManager::getTexture("assets/sprites/ui/ui_stage_frame_3.png"));
}

void StageSelectScene::handleInput(const sf::Event& event)
{
    if (event.type != sf::Event::KeyPressed) return;
    auto key = event.key.code;

    // ステージ選択（左右キー）
    if (key == sf::Keyboard::Left || key == sf::Keyboard::A) {
        selectedStage = (selectedStage - 1 + STAGE_COUNT) % STAGE_COUNT;
        AudioManager::playSE("assets/audio/se/se_cursor.ogg");
    }
    if (key == sf::Keyboard::Right || key == sf::Keyboard::D) {
        selectedStage = (selectedStage + 1) % STAGE_COUNT;
        AudioManager::playSE("assets/audio/se/se_cursor.ogg");
    }

    // 決定
    if (key == sf::Keyboard::Space || key == sf::Keyboard::Return) {
        AudioManager::playSE("assets/audio/se/se_select.ogg");
        GameData::currentStage = selectedStage + 1;  // 1-based
        nextScene = SceneType::GamePlay;
    }

    // タイトルに戻る
    if (key == sf::Keyboard::Escape) {
        nextScene = SceneType::Title;
    }
}

void StageSelectScene::update(float /*dt*/)
{
}

void StageSelectScene::render(sf::RenderWindow& window)
{
    window.setView(sf::View(sf::FloatRect(0.f, 0.f, 640.f, 360.f)));
    window.clear(sf::Color(30, 30, 50));

    const float cardSize = 128.f;
    const float cardSpacing = 40.f;
    const float totalWidth = STAGE_COUNT * cardSize + (STAGE_COUNT - 1) * cardSpacing;
    const float startX = (640.f - totalWidth) / 2.f;
    const float startY = 80.f;

    // 難易度表示用（星マーク代わりの四角）
    const int difficultyBars[STAGE_COUNT] = { 1, 2, 3 };

    for (int i = 0; i < STAGE_COUNT; ++i) {
        float x = startX + i * (cardSize + cardSpacing);
        float y = startY;

        // ステージフレームスプライト
        stageFrameSprites[i].setPosition(x, y);

        if (i == selectedStage) {
            // 選択中: 通常色 + 白枠
            stageFrameSprites[i].setColor(sf::Color::White);
        } else {
            // 非選択: 暗くする
            stageFrameSprites[i].setColor(sf::Color(100, 100, 100));
        }
        window.draw(stageFrameSprites[i]);

        // 選択中の白枠
        if (i == selectedStage) {
            sf::RectangleShape border(sf::Vector2f(cardSize, cardSize));
            border.setPosition(x, y);
            border.setFillColor(sf::Color::Transparent);
            border.setOutlineColor(sf::Color::White);
            border.setOutlineThickness(3.f);
            window.draw(border);
        }

        // 難易度表示（星マーク代わりの四角）
        for (int s = 0; s < difficultyBars[i]; ++s) {
            sf::RectangleShape star(sf::Vector2f(16.f, 16.f));
            star.setPosition(x + 10.f + s * 22.f, y + cardSize + 10.f);
            star.setFillColor(sf::Color(255, 215, 0));  // 金色
            window.draw(star);
        }
        // 空の星
        for (int s = difficultyBars[i]; s < 3; ++s) {
            sf::RectangleShape star(sf::Vector2f(16.f, 16.f));
            star.setPosition(x + 10.f + s * 22.f, y + cardSize + 10.f);
            star.setFillColor(sf::Color(60, 50, 30));
            star.setOutlineColor(sf::Color(120, 100, 60));
            star.setOutlineThickness(1.f);
            window.draw(star);
        }
    }

    // 選択カーソル（下向き三角）
    float arrowX = startX + selectedStage * (cardSize + cardSpacing) + cardSize / 2.f - 8.f;
    sf::ConvexShape arrow;
    arrow.setPointCount(3);
    arrow.setPoint(0, sf::Vector2f(0.f, 0.f));
    arrow.setPoint(1, sf::Vector2f(16.f, 0.f));
    arrow.setPoint(2, sf::Vector2f(8.f, 12.f));
    arrow.setPosition(arrowX, startY - 20.f);
    arrow.setFillColor(sf::Color::White);
    window.draw(arrow);
}

std::optional<SceneType> StageSelectScene::getNextScene() const
{
    return nextScene;
}
