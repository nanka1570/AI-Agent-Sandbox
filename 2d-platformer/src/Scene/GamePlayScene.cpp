// ゲームプレイシーンの実装
// プレイヤーの更新、敵のAI・更新、攻撃判定、接触ダメージ、ポーズを管理する
// GameData::currentStage に応じたステージを読み込む

#include "Scene/GamePlayScene.h"
#include "System/AudioManager.h"
#include "System/Collision.h"
#include "System/ResourceManager.h"
#include "GameData.h"

// コンストラクタ: ステージを読み込み、カメラ・ゴール・敵を初期化する
GamePlayScene::GamePlayScene()
    : stageId(GameData::currentStage)
    , paused(false)
    , pauseSelectedIndex(PAUSE_RESUME)
{
    tileMap.loadStage(stageId);
    camera.setBounds(tileMap.getPixelWidth(), tileMap.getPixelHeight());

    // ステージごとのスポーン位置とゴール位置
    switch (stageId) {
    case 1:
        spawnPoint = sf::Vector2f(64.f, 576.f);
        goalRect = sf::FloatRect(76.f * 32.f, 17.f * 32.f, 2.f * 32.f, 2.f * 32.f);
        break;
    case 2:
        spawnPoint = sf::Vector2f(64.f, 736.f);    // 左下（row 24の地面の上）
        goalRect = sf::FloatRect(42.f * 32.f, 1.f * 32.f, 4.f * 32.f, 2.f * 32.f);  // 右上（隙間2マス）
        break;
    case 3:
        spawnPoint = sf::Vector2f(64.f, 736.f);    // 左下
        goalRect = sf::FloatRect(76.f * 32.f, 21.f * 32.f, 2.f * 32.f, 2.f * 32.f);
        break;
    default:
        spawnPoint = sf::Vector2f(64.f, 576.f);
        goalRect = sf::FloatRect(76.f * 32.f, 17.f * 32.f, 2.f * 32.f, 2.f * 32.f);
        break;
    }

    // パララックス背景の読み込み
    std::string stageName;
    switch (stageId) {
    case 1:  stageName = "forest"; break;
    case 2:  stageName = "castle"; break;
    case 3:  stageName = "tower";  break;
    default: stageName = "forest"; break;
    }
    bgFar.setTexture(ResourceManager::getTexture("assets/sprites/bg_" + stageName + "_far.png"));
    bgMid.setTexture(ResourceManager::getTexture("assets/sprites/bg_" + stageName + "_mid.png"));
    bgNear.setTexture(ResourceManager::getTexture("assets/sprites/bg_" + stageName + "_near.png"));

    player.setPosition(spawnPoint);
    player.setVelocity(sf::Vector2f(0.f, 0.f));
    spawnEnemies();

    // ステージBGM
    AudioManager::playBGM("assets/audio/bgm/stage" + std::to_string(stageId) + ".ogg");
}

// ステージに応じた敵の初期配置
void GamePlayScene::spawnEnemies()
{
    switch (stageId) {
    case 1:
        // Stage 1: Slime 3体、Bat 2体（敵エリア cols 49-68）
        slimes.push_back(std::make_unique<Slime>(52.f * 32.f, 588.f));
        slimes.push_back(std::make_unique<Slime>(60.f * 32.f, 588.f));
        slimes.push_back(std::make_unique<Slime>(67.f * 32.f, 588.f));
        bats.push_back(std::make_unique<Bat>(56.f * 32.f, 500.f));
        bats.push_back(std::make_unique<Bat>(64.f * 32.f, 480.f));
        break;

    case 2:
        // Stage 2: Bat多め（古城、壁ジャンプ中のBatが厄介）
        slimes.push_back(std::make_unique<Slime>(10.f * 32.f, 23.f * 32.f - 20.f));
        bats.push_back(std::make_unique<Bat>(15.f * 32.f, 18.f * 32.f));
        bats.push_back(std::make_unique<Bat>(25.f * 32.f, 14.f * 32.f));
        bats.push_back(std::make_unique<Bat>(20.f * 32.f, 8.f * 32.f));
        bats.push_back(std::make_unique<Bat>(30.f * 32.f, 4.f * 32.f));
        break;

    case 3:
        // Stage 3: Slime・Bat両方多め（高難度）
        slimes.push_back(std::make_unique<Slime>(8.f * 32.f, 23.f * 32.f - 20.f));
        slimes.push_back(std::make_unique<Slime>(38.f * 32.f, 9.f * 32.f - 20.f));
        slimes.push_back(std::make_unique<Slime>(50.f * 32.f, 9.f * 32.f - 20.f));
        slimes.push_back(std::make_unique<Slime>(66.f * 32.f, 23.f * 32.f - 20.f));
        slimes.push_back(std::make_unique<Slime>(72.f * 32.f, 23.f * 32.f - 20.f));
        bats.push_back(std::make_unique<Bat>(14.f * 32.f, 18.f * 32.f));
        bats.push_back(std::make_unique<Bat>(44.f * 32.f, 8.f * 32.f));
        bats.push_back(std::make_unique<Bat>(56.f * 32.f, 10.f * 32.f));
        bats.push_back(std::make_unique<Bat>(70.f * 32.f, 18.f * 32.f));
        break;
    }
}

// 入力処理
void GamePlayScene::handleInput(const sf::Event& event)
{
    if (event.type != sf::Event::KeyPressed) return;
    auto key = event.key.code;

    // ポーズ切り替え
    if (key == sf::Keyboard::Escape) {
        if (paused) {
            paused = false;
        } else {
            paused = true;
            pauseSelectedIndex = PAUSE_RESUME;
        }
        return;
    }

    // ポーズ中のメニュー操作
    if (paused) {
        if (key == sf::Keyboard::Up || key == sf::Keyboard::W) {
            pauseSelectedIndex = (pauseSelectedIndex - 1 + PAUSE_MENU_COUNT) % PAUSE_MENU_COUNT;
            AudioManager::playSE("assets/audio/se/se_cursor.ogg");
        }
        if (key == sf::Keyboard::Down || key == sf::Keyboard::S) {
            pauseSelectedIndex = (pauseSelectedIndex + 1) % PAUSE_MENU_COUNT;
            AudioManager::playSE("assets/audio/se/se_cursor.ogg");
        }
        if (key == sf::Keyboard::Space || key == sf::Keyboard::Return) {
            AudioManager::playSE("assets/audio/se/se_select.ogg");
            if (pauseSelectedIndex == PAUSE_RESUME) {
                paused = false;
            } else if (pauseSelectedIndex == PAUSE_STAGE_SELECT) {
                nextScene = SceneType::StageSelect;
            }
        }
        return;
    }

    // 通常のゲームプレイ入力
    player.handleInput(event);
}

// ゲームロジックの更新
void GamePlayScene::update(float dt)
{
    // ポーズ中は更新しない
    if (paused) return;

    // 1. プレイヤーの移動・衝突解決
    player.update(dt, tileMap);

    // 2. 敵の更新（AIにプレイヤー位置を渡す）
    sf::Vector2f playerPos = player.getPosition();

    for (auto& slime : slimes) {
        if (!slime->isAlive()) continue;
        slime->updateAI(dt, playerPos);
        slime->update(dt, tileMap);
    }

    for (auto& bat : bats) {
        if (!bat->isAlive()) continue;
        bat->updateAI(dt, playerPos);
        bat->update(dt, tileMap);
    }

    // 3. 攻撃判定・接触ダメージ
    updateCombat();

    // 4. マップ下端より下に落ちたらダメージ+リスポーン
    if (player.getPosition().y > tileMap.getPixelHeight()) {
        player.takeDamage(1);
        player.setPosition(spawnPoint);
        player.setVelocity(sf::Vector2f(0.f, 0.f));
    }

    // 5. カメラをプレイヤー位置に追従させる
    camera.update(player.getPosition());

    // 6. プレイヤー死亡でゲームオーバー
    if (!player.isAlive()) {
        nextScene = SceneType::ResultGameOver;
    }

    // 7. ゴール判定
    if (goalRect.intersects(player.getHitbox())) {
        AudioManager::playSE("assets/audio/se/se_goal.ogg");
        nextScene = SceneType::ResultClear;
    }
}

// 攻撃判定・接触ダメージの処理
void GamePlayScene::updateCombat()
{
    // プレイヤーの攻撃が敵に当たるか
    if (player.getIsAttacking()) {
        sf::FloatRect atkBox = player.getAttackHitbox();

        for (auto& slime : slimes) {
            if (!slime->isAlive() || slime->isInHitState()) continue;
            if (atkBox.intersects(slime->getHitbox())) {
                slime->takeDamage(1);
            }
        }

        for (auto& bat : bats) {
            if (!bat->isAlive() || bat->isInHitState()) continue;
            if (atkBox.intersects(bat->getHitbox())) {
                bat->takeDamage(1);
            }
        }
    }

    // 敵がプレイヤーに接触したらダメージ
    if (!player.isInvincible()) {
        sf::FloatRect playerBox = player.getHitbox();

        for (auto& slime : slimes) {
            if (!slime->isAlive()) continue;
            if (playerBox.intersects(slime->getHitbox())) {
                player.takeDamage(1);
                break;
            }
        }

        if (!player.isInvincible()) {
            for (auto& bat : bats) {
                if (!bat->isAlive()) continue;
                if (playerBox.intersects(bat->getHitbox())) {
                    player.takeDamage(1);
                    break;
                }
            }
        }
    }
}

// パララックス背景を描画する
// 背景画像を拡大表示し、カメラ位置に応じてレイヤーごとに異なる速度でスクロールする
void GamePlayScene::renderBackground(sf::RenderWindow& window)
{
    sf::View gameView = window.getView();
    sf::Vector2f camCenter = gameView.getCenter();
    sf::Vector2f viewSize = gameView.getSize();

    // マップ全体に対するカメラの正規化位置（0.0～1.0）
    float mapW = tileMap.getPixelWidth();
    float mapH = tileMap.getPixelHeight();
    float normX = (camCenter.x - viewSize.x / 2.f) / std::max(1.f, mapW - viewSize.x);
    float normY = (camCenter.y - viewSize.y / 2.f) / std::max(1.f, mapH - viewSize.y);
    normX = std::max(0.f, std::min(1.f, normX));
    normY = std::max(0.f, std::min(1.f, normY));

    // 背景をビューより大きく表示してパララックスの余地を作る
    const float bgScale = 1.3f;
    float extraW = viewSize.x * (bgScale - 1.f);
    float extraH = viewSize.y * (bgScale - 1.f);

    // 画面固定ビューに切り替えて描画
    sf::View bgView(sf::FloatRect(0.f, 0.f, viewSize.x, viewSize.y));
    window.setView(bgView);

    // レイヤーごとにスケーリング＋パララックスオフセットで描画
    auto drawLayer = [&](sf::Sprite& layer, float factor) {
        layer.setScale(bgScale, bgScale);
        float ox = -extraW * 0.5f - (normX - 0.5f) * extraW * factor;
        float oy = -extraH * 0.5f - (normY - 0.5f) * extraH * factor;
        layer.setPosition(ox, oy);
        window.draw(layer);
    };

    drawLayer(bgFar,  0.2f);  // 遠景: わずかに動く
    drawLayer(bgMid,  0.6f);  // 中景: 中程度に動く
    drawLayer(bgNear, 1.0f);  // 近景: 大きく動く

    // ゲームビューに戻す
    window.setView(gameView);
}

// 描画処理
void GamePlayScene::render(sf::RenderWindow& window)
{
    camera.applyTo(window);

    // パララックス背景を描画（タイルマップの後ろ）
    renderBackground(window);

    tileMap.render(window);
    renderGoal(window);

    // 敵を描画
    for (auto& slime : slimes) {
        if (slime->isAlive()) slime->render(window);
    }
    for (auto& bat : bats) {
        if (bat->isAlive()) bat->render(window);
    }

    // プレイヤーを描画（敵より手前）
    player.render(window);

    // HUDを最前面に描画（画面固定）
    hud.render(window, player.getHp(), player.getMaxHp());

    // ポーズ中はオーバーレイとメニューを描画
    if (paused) {
        renderPause(window);
    }
}

// ゴールエリアを金色の矩形で描画する
void GamePlayScene::renderGoal(sf::RenderWindow& window)
{
    sf::RectangleShape goalShape(sf::Vector2f(goalRect.width, goalRect.height));
    goalShape.setPosition(goalRect.left, goalRect.top);
    goalShape.setFillColor(sf::Color(255, 215, 0, 120));
    goalShape.setOutlineColor(sf::Color(255, 215, 0));
    goalShape.setOutlineThickness(2.f);
    window.draw(goalShape);
}

// ポーズ画面のオーバーレイとメニューを描画する
void GamePlayScene::renderPause(sf::RenderWindow& window)
{
    // HUD用のビューに切り替え（画面固定で描画するため）
    sf::View prevView = window.getView();
    window.setView(sf::View(sf::FloatRect(0.f, 0.f, 640.f, 360.f)));

    // 半透明の暗いオーバーレイ
    sf::RectangleShape overlay(sf::Vector2f(640.f, 360.f));
    overlay.setFillColor(sf::Color(0, 0, 0, 150));
    window.draw(overlay);

    // "PAUSE" タイトルバー
    sf::RectangleShape titleBar(sf::Vector2f(200.f, 40.f));
    titleBar.setPosition(220.f, 80.f);
    titleBar.setFillColor(sf::Color(60, 60, 80));
    titleBar.setOutlineColor(sf::Color(120, 120, 160));
    titleBar.setOutlineThickness(2.f);
    window.draw(titleBar);

    // メニュー項目
    const float menuStartY = 160.f;
    const float menuSpacing = 50.f;

    for (int i = 0; i < PAUSE_MENU_COUNT; ++i) {
        sf::RectangleShape menuItem(sf::Vector2f(220.f, 32.f));
        float x = 210.f;
        float y = menuStartY + i * menuSpacing;
        menuItem.setPosition(x, y);

        if (i == pauseSelectedIndex) {
            menuItem.setFillColor(sf::Color(200, 200, 200));
        } else {
            menuItem.setFillColor(sf::Color(80, 80, 100));
        }
        window.draw(menuItem);

        // 選択カーソル
        if (i == pauseSelectedIndex) {
            sf::ConvexShape arrow;
            arrow.setPointCount(3);
            arrow.setPoint(0, sf::Vector2f(0.f, 0.f));
            arrow.setPoint(1, sf::Vector2f(0.f, 16.f));
            arrow.setPoint(2, sf::Vector2f(12.f, 8.f));
            arrow.setPosition(192.f, y + 8.f);
            arrow.setFillColor(sf::Color::White);
            window.draw(arrow);
        }
    }

    // 元のビューに戻す
    window.setView(prevView);
}

std::optional<SceneType> GamePlayScene::getNextScene() const
{
    return nextScene;
}
