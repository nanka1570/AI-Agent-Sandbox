// リソース管理クラスの実装
// assets/ ディレクトリからテクスチャを読み込み、static mapにキャッシュする

#include "System/ResourceManager.h"

#include <iostream>

std::unordered_map<std::string, sf::Texture> ResourceManager::textures;

sf::Texture& ResourceManager::getTexture(const std::string& filename)
{
    // 既にキャッシュにあればそれを返す
    auto it = textures.find(filename);
    if (it != textures.end()) {
        return it->second;
    }

    // 新規読み込み
    sf::Texture& tex = textures[filename];
    if (!tex.loadFromFile(filename)) {
        std::cerr << "[ResourceManager] Failed to load: " << filename << std::endl;
    }
    tex.setSmooth(false);
    return tex;
}
