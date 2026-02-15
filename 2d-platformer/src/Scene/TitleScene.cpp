// タイトル画面の実装
// ロゴ画像とボタン画像でタイトル画面を表示する
// 上下キーでメニュー選択、Spaceで決定

#include "Scene/TitleScene.h"
#include "System/ResourceManager.h"

TitleScene::TitleScene()
{
    // ロゴスプライト（400x200, 画面中央上部）
    logoSprite.setTexture(ResourceManager::getTexture("assets/sprites/ui/logo_title.png"));
    // 内部解像度 640x360 に対してロゴを中央配置
    logoSprite.setPosition((640.f - 400.f) / 2.f, 30.f);

    // ボタンスプライト（200x60）
    sf::Texture& btnTex = ResourceManager::getTexture("assets/sprites/ui/ui_button_standard.png");
    sf::Texture& btnHoverTex = ResourceManager::getTexture("assets/sprites/ui/ui_button_hover.png");

    for (int i = 0; i < MENU_COUNT; ++i) {
        buttonSprites[i].setTexture(btnTex);
        buttonHoverSprites[i].setTexture(btnHoverTex);
        float x = (640.f - 200.f) / 2.f;
        float y = 200.f + i * 70.f;
        buttonSprites[i].setPosition(x, y);
        buttonHoverSprites[i].setPosition(x, y);
    }
}

void TitleScene::handleInput(const sf::Event& event)
{
    if (event.type != sf::Event::KeyPressed) return;
    auto key = event.key.code;

    // メニュー選択（上下キー）
    if (key == sf::Keyboard::Up || key == sf::Keyboard::W) {
        selectedIndex = (selectedIndex - 1 + MENU_COUNT) % MENU_COUNT;
    }
    if (key == sf::Keyboard::Down || key == sf::Keyboard::S) {
        selectedIndex = (selectedIndex + 1) % MENU_COUNT;
    }

    // 決定
    if (key == sf::Keyboard::Space || key == sf::Keyboard::Return) {
        if (selectedIndex == MENU_START) {
            nextScene = SceneType::StageSelect;
        } else if (selectedIndex == MENU_QUIT) {
            nextScene = SceneType::Quit;
        }
    }
}

void TitleScene::update(float /*dt*/)
{
}

void TitleScene::render(sf::RenderWindow& window)
{
    // ビューをリセット
    window.setView(sf::View(sf::FloatRect(0.f, 0.f, 640.f, 360.f)));
    window.clear(sf::Color(25, 25, 60));

    // ロゴ描画
    window.draw(logoSprite);

    // ボタン描画
    for (int i = 0; i < MENU_COUNT; ++i) {
        if (i == selectedIndex) {
            window.draw(buttonHoverSprites[i]);
        } else {
            window.draw(buttonSprites[i]);
        }

        // 選択カーソル（三角形）
        if (i == selectedIndex) {
            float y = 200.f + i * 70.f;
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

std::optional<SceneType> TitleScene::getNextScene() const
{
    return nextScene;
}
