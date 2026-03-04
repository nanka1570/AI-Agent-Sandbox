---
name: react-code-review
description: kakeibo-app（家計簿アプリ）のReact/TypeScript/Next.js/Prismaコードをレビューする際に使用するチェックリスト。汎用版コードレビュースキル（code-review）の補足として、React/TypeScript/Prisma固有の観点のみを扱う。汎用版と併用すること。
---

# React/TypeScript コードレビュースキル（kakeibo-app版）

## 概要

汎用版コードレビュースキル（code-review）を補足する、React/TypeScript/Next.js/Prisma固有のチェックリスト。
汎用版に記載済みの原則（命名、責務分離、エラー処理等）はここでは扱わない。

**前提:** 汎用版スキルと併用する。レビュー方針（★の意味、指摘は3つまで、before/after提示）は汎用版に準ずる。

---

## ■ 1. TypeScript型安全

### ★★★ `any`型を使っていないか
```typescript
// ❌ 型チェックが無効化される
const [cards, setCards] = useState<any[]>([])

// ✅ Prisma生成型またはカスタム型を使用
import type { CreditCard } from '@prisma/client'
const [cards, setCards] = useState<CreditCard[]>([])
```

### ★★★ 関数の引数・戻り値に型があるか
```typescript
// ❌ 引数も戻り値も型不明
const formatAmount = (amount) => { ... }

// ✅ 型を明示
const formatAmount = (amount: number): string => {
  return `¥${amount.toLocaleString()}`
}
```

### ★★☆ Optional Chaining / Nullish Coalescingを使っているか
```typescript
// ❌ dataがnullならクラッシュ
setCardName(data.name)

// ✅ 安全なアクセス
setCardName(data?.name ?? '')
```

---

## ■ 2. Reactパターン

### ★★★ コンポーネント名がファイルの内容と一致しているか
```typescript
// ❌ credit-cards/page.tsx なのに関数名が Payments
export default function Payments() { ... }

// ✅ ファイルパスと一致
export default function CreditCardsPage() { ... }
```

### ★★★ useEffect内で異なる責務の処理を混在させていないか
```typescript
// ❌ 1つのuseEffectに全部入っている
useEffect(() => {
  loadCreditCards()
  loadSalaries()
  loadPayments()
}, [month])

// ✅ 責務ごとに分離（またはServer Componentでデータ取得）
// Next.js App Routerでは Server Component で直接 Prisma を呼ぶのが推奨
```

### ★★★ state数が多すぎないか（目安: 1コンポーネント10個以内）
```typescript
// ❌ フォーム用5個 + 一覧用5個 + モーダル用3個 = 13個のstate
// → コンポーネント分割またはReact Hook Formでフォーム状態を管理

// ✅ フォーム状態はReact Hook Formに委譲
const { register, handleSubmit } = useForm<CreditCardFormData>()
```

### ★★☆ 三項演算子が深くネストしていないか
```typescript
// ❌ 条件分岐の中にmap()が長く続く
{status === 'confirmed' ? (
  payments.map(...50行...)
) : (
  payments.map(...50行...)
)}

// ✅ 早期returnまたはコンポーネント分割で平坦化
```

---

## ■ 3. Prisma・DB連携

### ★★★ Prisma操作に try-catch があるか
```typescript
// ❌ エラーを無視
const cards = await prisma.creditCard.findMany()

// ✅ エラーをキャッチして安全に処理
try {
  const cards = await prisma.creditCard.findMany()
  return cards
} catch (error) {
  console.error('クレカ取得エラー:', error)
  throw new Error('クレジットカードの取得に失敗しました')
}
```

### ★★★ Server Actions でバリデーションしているか
```typescript
// ❌ クライアントからのデータをそのまま使用
export async function createCreditCard(data: unknown) {
  await prisma.creditCard.create({ data })
}

// ✅ Zodでバリデーション後に使用
export async function createCreditCard(data: unknown) {
  const validated = creditCardSchema.parse(data)
  await prisma.creditCard.create({ data: validated })
}
```

### ★★★ 支払いの重複チェックを実装しているか
- 同一クレジットカード・同一月の支払いが重複していないか
- INSERT前にSELECTで確認する、またはPrismaの@@uniqueで制約をかける

### ★★☆ TypeScript型がPrisma生成型と整合しているか
- カスタム型を定義する場合、Prisma生成型（`@prisma/client`）と矛盾しないこと
- リレーション付きの型は `Prisma.CreditCardGetPayload<{ include: { payments: true } }>` 等を活用

---

## ■ 4. kakeibo-app UI規約

### ★★★ shadcn/ui の Button variant を正しく使い分けているか
| 用途 | variant | 例 |
|------|---------|-----|
| 主要アクション（登録・保存） | `default` | 「登録する」「保存する」 |
| 破壊的アクション（削除） | `destructive` | 「削除する」 |
| 補助アクション（キャンセル・閉じる） | `outline` | 「キャンセル」「閉じる」 |
| 軽微なアクション | `ghost` | アイコンボタン、編集リンク |

### ★★★ ボタン配置ルール
- 左: キャンセル・閉じる等の非破壊的アクション
- 右: 保存・登録等の主要アクション

### ★★☆ ステータス表示の整合性
| ステータス | 表示 | バッジ色 |
|-----------|------|---------|
| unconfirmed（未確定） | 「未確定」 | グレー |
| confirmed（確定） | 「確定」 | 青 |
| paid（支払い済み） | 「支払い済み」 | 緑 |

ステータス変更時に、逆方向の遷移（paid → confirmed）が可能かどうかを明確にする。

### ★★☆ 金額のフォーマット
- 円記号（¥）付きで表示: `¥30,000`
- 入力フォームでは数値のみ受け付ける
- カンマ区切りで表示する

---

## ■ 5. Next.js（App Router）

### ★★★ `next/navigation`を使っているか（`next/router`ではない）
```typescript
// ❌ Pages Router用（App Routerでは動かない）
import { useRouter } from 'next/router'

// ✅ App Router用
import { useRouter } from 'next/navigation'
```

### ★★★ Server Component と Client Component を適切に分離しているか
- データ取得（Prisma呼び出し）は Server Component で行う
- インタラクション（フォーム、モーダル、onClick）は `'use client'` で行う
- Server Component からデータを props で Client Component に渡す

### ★★☆ 'use client'が必要なコンポーネントにのみ付いているか
- useState, useEffect, onClick を使うコンポーネントには `'use client'` が必要
- Server Component で済む場合は付けない（パフォーマンスに影響）

---

## レビュー実行手順

1. **汎用版スキル（code-review）のチェックも併せて実施する**
2. **対象ファイルを全て読み込む**（推測でレビューしない）
3. **設計書との整合性を確認する**
   - 要件定義書: `docs/01_要件定義書_v1_0.md`
   - 基本設計書: `docs/02_基本設計書_v1_0.md`（Phase 2以降）
   - DB設計書: `docs/03_DB設計書_v1_0.md`（Phase 1以降）
   - 画面設計書: `docs/04_画面設計書_v1_0.md`（Phase 2以降）
   - 詳細設計書: `docs/05_詳細設計書_v1_0.md`（Phase 3以降）
4. **指摘は汎用版と合わせて最大3つに絞る**
