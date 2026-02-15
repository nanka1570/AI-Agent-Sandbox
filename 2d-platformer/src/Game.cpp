#include "Game.h"
#include "Scene/TitleScene.h"
#include "Scene/StageSelectScene.h"
#include "Scene/GamePlayScene.h"
#include "Scene/ResultScene.h"

// コンストラクタ: ウィンドウと内部解像度ビューを初期化し、タイトル画面から開始する
Game::Game()
    : window(sf::VideoMode(1280, 720), "2D Fantasy Platformer", sf::Style::Close)
    , gameView(sf::FloatRect(0.f, 0.f, 640.f, 360.f))
{
    window.setView(gameView);
    currentScene = std::make_unique<TitleScene>();
}

// 固定タイムステップ方式のゲームループ
// 経過時間をaccumulatorに蓄積し、1/60秒ごとにupdate()を実行する
// render()は毎ループ1回だけ実行する
void Game::run()
{
    sf::Clock clock;
    float accumulator = 0.0f;

    while (window.isOpen()) {
        float frameTime = clock.restart().asSeconds();
        if (frameTime > MAX_FRAME_TIME) {
            frameTime = MAX_FRAME_TIME;
        }
        accumulator += frameTime;

        processEvents();

        while (accumulator >= FIXED_DT) {
            update(FIXED_DT);
            accumulator -= FIXED_DT;
        }

        render();
    }
}

// SFMLのイベントキューからイベントを取り出して処理する
void Game::processEvents()
{
    sf::Event event;
    while (window.pollEvent(event)) {
        if (event.type == sf::Event::Closed) {
            window.close();
            return;
        }
        currentScene->handleInput(event);
    }
}

// 現在のシーンを更新し、シーン遷移の要求があれば切り替える
void Game::update(float dt)
{
    currentScene->update(dt);

    auto nextScene = currentScene->getNextScene();
    if (nextScene.has_value()) {
        changeScene(nextScene.value());
    }
}

// 現在のシーンを描画してウィンドウに表示する
void Game::render()
{
    currentScene->render(window);
    window.display();
}

// SceneTypeに応じて新しいシーンを生成し、現在のシーンを置き換える
void Game::changeScene(SceneType type)
{
    switch (type) {
    case SceneType::Title:
        currentScene = std::make_unique<TitleScene>();
        break;
    case SceneType::StageSelect:
        currentScene = std::make_unique<StageSelectScene>();
        break;
    case SceneType::GamePlay:
        currentScene = std::make_unique<GamePlayScene>();
        break;
    case SceneType::ResultClear:
        currentScene = std::make_unique<ResultScene>(true);
        break;
    case SceneType::ResultGameOver:
        currentScene = std::make_unique<ResultScene>(false);
        break;
    case SceneType::Quit:
        window.close();
        break;
    }
}
