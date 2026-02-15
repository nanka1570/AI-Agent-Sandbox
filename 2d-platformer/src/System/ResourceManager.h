// リソース管理クラス（設計書 §10）
// テクスチャの読み込みとキャッシュを一元管理する
// 同じファイルを複数回読み込まないようにする

#pragma once

#include <string>
#include <unordered_map>

#include <SFML/Graphics.hpp>

class ResourceManager {
public:
    // テクスチャを取得する（未読み込みなら読み込んでキャッシュ）
    static sf::Texture& getTexture(const std::string& filename);

private:
    static std::unordered_map<std::string, sf::Texture> textures;
};
