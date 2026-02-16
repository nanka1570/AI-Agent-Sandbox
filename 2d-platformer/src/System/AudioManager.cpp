// オーディオ管理クラスの実装

#include "System/AudioManager.h"

#include <iostream>

sf::Music AudioManager::bgm;
std::string AudioManager::currentBGMFile;
std::unordered_map<std::string, sf::SoundBuffer> AudioManager::buffers;
sf::Sound AudioManager::sounds[MAX_SOUNDS];
int AudioManager::soundIndex = 0;

void AudioManager::playBGM(const std::string& filename, bool loop)
{
    // 同じBGMが再生中ならスキップ
    if (currentBGMFile == filename && bgm.getStatus() == sf::Music::Playing) {
        return;
    }

    bgm.stop();
    if (!bgm.openFromFile(filename)) {
        std::cerr << "[AudioManager] Failed to load BGM: " << filename << std::endl;
        return;
    }
    bgm.setLoop(loop);
    bgm.play();
    currentBGMFile = filename;
}

void AudioManager::stopBGM()
{
    bgm.stop();
    currentBGMFile.clear();
}

void AudioManager::playSE(const std::string& filename)
{
    // バッファをキャッシュから取得（未読み込みなら読み込む）
    auto it = buffers.find(filename);
    if (it == buffers.end()) {
        sf::SoundBuffer buf;
        if (!buf.loadFromFile(filename)) {
            // ファイルが存在しない場合は無視（将来の素材追加に対応）
            return;
        }
        buffers[filename] = std::move(buf);
        it = buffers.find(filename);
    }

    // サウンドプールの次のスロットを使って再生
    sounds[soundIndex].setBuffer(it->second);
    sounds[soundIndex].play();
    soundIndex = (soundIndex + 1) % MAX_SOUNDS;
}
