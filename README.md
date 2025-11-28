# 筋肉アプリ - 管理画面

「俺の筋肉をみろ」アプリの管理者用Webページです。

## 機能

### 実装済み管理機能

1. **ダッシュボード** (`/`)
   - 統計サマリー（ユーザー数、投稿数、収益など）
   - 管理メニュー
   - 最近のアクティビティ

2. **ユーザー管理** (`/users`)
   - ユーザー一覧・検索
   - 権限管理（viewer/trainer/admin）
   - 認証ステータス管理
   - アカウント停止/復活

3. **コミュニティ投稿管理** (`/posts`)
   - 投稿一覧・フィルタ
   - 通報対応
   - 投稿削除・非表示

4. **筋肉写真管理** (`/photos`)
   - 筋肉図鑑の写真管理
   - 部位別フィルタ
   - 通報対応
   - 写真削除

5. **サービス管理** (`/services`)
   - トレーナーサービス管理
   - サービス購入履歴

6. **ポイント管理** (`/points`)
   - ポイント残高管理
   - 取引履歴
   - 手動調整

7. **通知管理** (`/notifications`)
   - 全体通知送信
   - プッシュ通知設定

8. **ランキング管理** (`/rankings`)
   - ランキング確認
   - ピックアップユーザー設定

9. **統計・分析** (`/analytics`)
   - ユーザー数推移
   - アクティブユーザー統計
   - 収益分析
   - 人気コンテンツ分析

10. **広告管理** (`/ads`)
    - バナー広告設定

11. **オンラインショップ管理** (`/shop`)
    - 商品登録・編集・削除
    - 在庫管理
    - 注文管理

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UI**: React 19

## セットアップ

### 必要な環境

- Node.js 18.17以上
- npm 9以上

### インストール

```bash
cd admin-web
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

開発サーバーが起動します:
- Local: http://localhost:3000
- Network: http://192.168.0.14:3000

ブラウザで http://localhost:3000 にアクセスしてください。

### ビルド

```bash
npm run build
npm run start
```

## ディレクトリ構成

```
admin-web/
├── app/                    # Next.js App Router
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ダッシュボード
│   ├── users/             # ユーザー管理
│   ├── posts/             # 投稿管理
│   ├── photos/            # 写真管理
│   ├── services/          # サービス管理
│   ├── points/            # ポイント管理
│   ├── notifications/     # 通知管理
│   ├── rankings/          # ランキング管理
│   ├── analytics/         # 統計分析
│   ├── ads/               # 広告管理
│   └── shop/              # ショップ管理
├── components/            # 共通コンポーネント
├── lib/                   # ユーティリティ
├── public/                # 静的ファイル
├── package.json
├── tailwind.config.ts     # Tailwind設定
├── tsconfig.json          # TypeScript設定
└── next.config.mjs        # Next.js設定
```

## 次のステップ

### Firebase連携

現在はモックデータで動作しています。実際のFirebaseデータベースと連携するには:

1. Firebase Admin SDKの設定
2. 認証システムの実装（Firebase Auth）
3. Firestoreからのデータ取得実装
4. セキュリティルールの設定

### 追加機能

- リアルタイムデータ更新
- グラフ・チャートの実装（Chart.js）
- CSV/Excelエクスポート
- 一括操作機能
- 検索機能の強化
- ページネーションの実装

## ライセンス

ISC
