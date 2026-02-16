// オーディオ管理クラス
// BGM（sf::Music, ストリーミング再生）とSE（sf::SoundBuffer + sf::Sound）を一元管理する
// BGMは同じファイルなら再起動しない。SEは最大8音同時再生。

#pragma once

#include <string>
#include <unordered_map>

#include <SFML/Audio.hpp>

class AudioManager {
public:
    // BGMを再生する（同じファイルが再生中なら何もしない）
    static void playBGM(const std::string& filename, bool loop = true);
    static void stopBGM();

    // SEを一回再生する（ファイルが存在しない場合はstderrに出力して無視）
    static void playSE(const std::string& filename);

private:
    static sf::Music bgm;
    static std::string currentBGMFile;

    static std::unordered_map<std::string, sf::SoundBuffer> buffers;
    static constexpr int MAX_SOUNDS = 8;
    static sf::Sound sounds[MAX_SOUNDS];
    static int soundIndex;
};
