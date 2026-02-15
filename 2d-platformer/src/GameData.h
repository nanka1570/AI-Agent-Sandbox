// シーン間で共有するゲームデータ
// シーン遷移時に必要な情報（現在のステージ番号等）を保持する

#pragma once

namespace GameData {
    inline int currentStage = 1;  // 現在選択されているステージ（1〜3）
}
