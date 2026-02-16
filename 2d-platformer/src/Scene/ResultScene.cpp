// リザルト画面の実装
// クリア/ゲームオーバーのテキスト画像を表示し、ボタン画像でメニューを選択する
// 上下キーでメニュー選択、SpaceまたはEnterで決定

#include "Scene/ResultScene.h"
#include "System/AudioManager.h"
#include "System/ResourceManager.h"

ResultScene::ResultScene(bool cleared)
    : isCleared(cleared)
    , selectedIndex(MENU_STAGE_SELECT)
{
    // リザルトBGM（ジングル、ループなし）
    if (isCleared) {
        AudioManager::playBGM("assets/audio/bgm/game-clear.ogg", false);
    } else {
        AudioManager::playBGM("assets/audio/bgm/game-over.ogg", false);
    }

    // リザルトテキスト画像（400x100, 画面中央上部）
    if (isCleared) {
        resultTextSprite.setTexture(ResourceManager::getTexture("assets/sprites/ui/text_stage_clear.png"));
    } else {
        resultTextSprite.setTexture(ResourceManager::getTexture("assets/sprites/ui/text_game_over.png"));
    }
    resultTextSprite.setPosition((640.f - 400.f) / 2.f, 40.f);

    // ボタンスプライト（200x60）
    sf::Texture& btnTex = ResourceManager::getTexture("assets/sprites/ui/ui_button_standard.png");
    sf::Texture& btnHoverTex = ResourceManager::getTexture("assets/sprites/ui/ui_button_hover.png");

    for (int i = 0; i < MENU_COUNT; ++i) {
        buttonSprites[i].setTexture(btnTex);
        buttonHoverSprites[i].setTexture(btnHoverTex);
        float x = (640.f - 200.f) / 2.f;
        float y = 180.f + i * 70.f;
        buttonSprites[i].setPosition(x, y);
        buttonHoverSprites[i].setPosition(x, y);
    }
}

void ResultScene::handleInput(const sf::Event& event)
{
    if (event.type != sf::Event::KeyPressed) return;
    auto key = event.key.code;

    // メニュー選択（上下キー）
    if (key == sf::Keyboard::Up || key == sf::Keyboard::W) {
        selectedIndex = (selectedIndex - 1 + MENU_COUNT) % MENU_COUNT;
        AudioManager::playSE("assets/audio/se/se_cursor.ogg");
    }
    if (key == sf::Keyboard::Down || key == sf::Keyboard::S) {
        selectedIndex = (selectedIndex + 1) % MENU_COUNT;
        AudioManager::playSE("assets/audio/se/se_cursor.ogg");
    }

    // 決定
    if (key == sf::Keyboard::Space || key == sf::Keyboard::Return) {
        AudioManager::playSE("assets/audio/se/se_select.ogg");
        if (selectedIndex == MENU_STAGE_SELECT) {
            nextScene = SceneType::StageSelect;
        } else if (selectedIndex == MENU_TITLE) {
            nextScene = SceneType::Title;
        }
    }
}

void ResultScene::update(float /*dt*/)
{
}

void ResultScene::render(sf::RenderWindow& window)
{
    // ビューをリセット
    window.setView(sf::View(sf::FloatRect(0.f, 0.f, 640.f, 360.f)));

    // 背景色: クリア=青緑、ゲームオーバー=暗い赤
    if (isCleared) {
        window.clear(sf::Color(30, 60, 80));
    } else {
        window.clear(sf::Color(60, 20, 20));
    }

    // リザルトテキスト描画
    window.draw(resultTextSprite);

    // ボタン描画
    for (int i = 0; i < MENU_COUNT; ++i) {
        if (i == selectedIndex) {
            window.draw(buttonHoverSprites[i]);
        } else {
            window.draw(buttonSprites[i]);
        }

        // 選択カーソル（三角形）
        if (i == selectedIndex) {
            float y = 180.f + i * 70.f;
            sf::ConvexShape arrow;
            arrow.setPointCount(3);
            arrow.setPoint(0, sf::Vector2f(0.f, 0.f));
            arrow.setPoint(1, sf::Vector2f(0.f, 16.f));
            arrow.setPoint(2, sf::Vector2f(12.f, 8.f));
            arrow.setPosition((640.f - 200.f) / 2.f - 20.f, y + 22.f);
            arrow.setFillColor(sf::Color::White);
            window.draw(arrow);
        }
    }
}

std::optional<SceneType> ResultScene::getNextScene() const
{
    return nextScene;
}
