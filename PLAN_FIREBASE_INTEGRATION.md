# Firebase連携実装計画

## 概要

admin-webとonline-shopの両プロジェクトからモックデータを削除し、Firebaseに統合する。

---

## 現状分析

### admin-web
- **Firebase設定**: あり (`/lib/firebase.ts`)
- **モックデータ**: 120商品、6注文、7在庫ログ (`/lib/mockData.ts`)
- **Firebase依存**: `firebase: ^12.5.0` インストール済み

### online-shop
- **Firebase設定**: なし
- **モックデータ**: 75商品（各ページにハードコード）
- **Firebase依存**: なし

### データ構造の差異
| フィールド | admin-web | online-shop |
|-----------|-----------|-------------|
| 価格 | `price`, `originalPrice` | `originalPrice`, `salePrice` |
| 状態 | `status` | なし |
| 評価 | なし | `rating`, `reviews` |
| 詳細説明 | `description`のみ | `description`, `longDescription`, `details` |

---

## Phase 1: 基盤整備

### 1.1 Firestore コレクション設計

```
products/
  ├─ {productId}
  │   ├─ name: string
  │   ├─ description: string
  │   ├─ longDescription: string
  │   ├─ price: number
  │   ├─ originalPrice: number | null
  │   ├─ stock: number
  │   ├─ category: "supplement" | "equipment" | "wear" | "accessories" | "other"
  │   ├─ status: "active" | "inactive" | "out_of_stock"
  │   ├─ image: string
  │   ├─ rating: number
  │   ├─ reviews: number
  │   ├─ details: { content?, ingredients?, material?, size?, weight?, manufacturer?, origin? }
  │   ├─ createdAt: timestamp
  │   └─ updatedAt: timestamp

orders/
  ├─ {orderId}
  │   ├─ orderNumber: string
  │   ├─ customer: { name, email, phone }
  │   ├─ shippingAddress: { zipCode, prefecture, city, address, building? }
  │   ├─ items: [{ productId, productName, quantity, price, image }]
  │   ├─ subtotal: number
  │   ├─ tax: number
  │   ├─ shipping: number
  │   ├─ total: number
  │   ├─ paymentMethod: "credit_card" | "bank_transfer" | "convenience_store"
  │   ├─ paymentStatus: "pending" | "paid" | "failed"
  │   ├─ status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  │   ├─ createdAt: timestamp
  │   └─ updatedAt: timestamp
```

### 1.2 online-shopにFirebase追加

**対象ファイル:**
- `online-shop/package.json` - firebase依存追加
- `online-shop/lib/firebase.ts` - 新規作成（admin-webと同じ設定）

### 1.3 共通型定義の作成

**対象ファイル:**
- `admin-web/lib/types.ts` - 新規作成
- `online-shop/lib/types.ts` - 新規作成（同一内容）

---

## Phase 2: サービス層の構築

### 2.1 admin-web サービス層

**新規作成ファイル:**
```
admin-web/lib/services/
  ├─ productService.ts   # 商品CRUD
  └─ orderService.ts     # 注文CRUD
```

**productService.ts 機能:**
- `getProducts(filter?)` - 商品一覧取得
- `getProductById(id)` - 商品詳細取得
- `createProduct(data)` - 商品作成
- `updateProduct(id, data)` - 商品更新
- `deleteProduct(id)` - 商品削除

**orderService.ts 機能:**
- `getOrders(filter?)` - 注文一覧取得
- `getOrderById(id)` - 注文詳細取得
- `updateOrderStatus(id, status)` - ステータス更新

### 2.2 online-shop サービス層

**新規作成ファイル:**
```
online-shop/lib/services/
  ├─ productService.ts   # 商品取得（読み取り専用）
  └─ orderService.ts     # 注文作成
```

**productService.ts 機能:**
- `getProducts(filter?)` - 商品一覧取得
- `getProductById(id)` - 商品詳細取得
- `getRelatedProducts(category, excludeId)` - 関連商品取得

**orderService.ts 機能:**
- `createOrder(data)` - 注文作成

---

## Phase 3: admin-web モック削除・Firebase連携

### 3.1 商品管理ページ

**対象ファイル:** `admin-web/app/shop/page.tsx`

**変更内容:**
- mockProductsのインポート削除
- mockOrdersのインポート削除
- useEffect + useState でFirestoreから取得
- ローディング状態追加
- エラーハンドリング追加

### 3.2 商品登録ページ

**対象ファイル:** `admin-web/app/shop/products/new/page.tsx`

**変更内容:**
- productService.createProduct() を呼び出し
- 成功/エラー通知追加

### 3.3 商品編集ページ

**対象ファイル:** `admin-web/app/shop/products/[id]/edit/page.tsx`

**変更内容:**
- mockProductsのインポート削除
- productService.getProductById() で取得
- productService.updateProduct() で更新
- productService.deleteProduct() で削除

### 3.4 モックデータファイル削除

**対象ファイル:** `admin-web/lib/mockData.ts`
- 最終的に削除（型定義のみ types.ts に移動済み）

---

## Phase 4: online-shop モック削除・Firebase連携

### 4.1 商品一覧ページ

**対象ファイル:** `online-shop/app/page.tsx`

**変更内容:**
- 75商品のハードコードを削除
- productService.getProducts() で取得
- Server Component → Client Component への変更検討
- または SSR/ISR で取得

### 4.2 商品詳細ページ

**対象ファイル:** `online-shop/app/product/[id]/page.tsx`

**変更内容:**
- ハードコード商品削除
- productService.getProductById() で取得
- productService.getRelatedProducts() で関連商品取得

### 4.3 カートページ

**対象ファイル:** `online-shop/app/cart/page.tsx`

**変更内容:**
- ハードコードのカートアイテム削除
- CartContext から取得するように変更

### 4.4 チェックアウトページ

**対象ファイル:** `online-shop/app/checkout/page.tsx`

**変更内容:**
- ハードコードの注文アイテム削除
- CartContext からカート取得
- orderService.createOrder() で注文作成
- 成功時にカートクリア

### 4.5 カートコンテキスト改善

**対象ファイル:** `online-shop/app/components/CartContext.tsx`

**変更内容:**
- localStorage への永続化追加
- 初期化時にlocalStorageから復元

---

## Phase 5: 初期データ投入

### 5.1 データマイグレーションスクリプト

**新規作成:** `admin-web/scripts/seedProducts.ts`

**内容:**
- 統合された商品データ（120件）をFirestoreに投入
- カテゴリ別に整理
- 画像URLはプレースホルダー

---

## 実装順序（推奨）

```
1. Phase 1.3: 共通型定義
      ↓
2. Phase 1.2: online-shopにFirebase追加
      ↓
3. Phase 2.1: admin-web サービス層
      ↓
4. Phase 2.2: online-shop サービス層
      ↓
5. Phase 5.1: 初期データ投入スクリプト
      ↓
6. Phase 3: admin-web モック削除（商品管理 → 登録 → 編集）
      ↓
7. Phase 4.5: カートコンテキスト改善
      ↓
8. Phase 4: online-shop モック削除（一覧 → 詳細 → カート → チェックアウト）
      ↓
9. Phase 3.4: mockData.ts 削除
```

---

## 変更ファイル一覧

### 新規作成
| ファイル | 説明 |
|---------|------|
| `admin-web/lib/types.ts` | 共通型定義 |
| `admin-web/lib/services/productService.ts` | 商品サービス |
| `admin-web/lib/services/orderService.ts` | 注文サービス |
| `admin-web/scripts/seedProducts.ts` | データ投入スクリプト |
| `online-shop/lib/firebase.ts` | Firebase設定 |
| `online-shop/lib/types.ts` | 共通型定義 |
| `online-shop/lib/services/productService.ts` | 商品サービス |
| `online-shop/lib/services/orderService.ts` | 注文サービス |

### 変更
| ファイル | 変更内容 |
|---------|---------|
| `online-shop/package.json` | firebase依存追加 |
| `admin-web/app/shop/page.tsx` | Firestore連携 |
| `admin-web/app/shop/products/new/page.tsx` | Firestore連携 |
| `admin-web/app/shop/products/[id]/edit/page.tsx` | Firestore連携 |
| `online-shop/app/page.tsx` | Firestore連携 |
| `online-shop/app/product/[id]/page.tsx` | Firestore連携 |
| `online-shop/app/cart/page.tsx` | CartContext連携 |
| `online-shop/app/checkout/page.tsx` | Firestore連携 |
| `online-shop/app/components/CartContext.tsx` | localStorage永続化 |

### 削除
| ファイル | 理由 |
|---------|------|
| `admin-web/lib/mockData.ts` | Firebase移行完了後 |

---

## 注意事項

1. **同一Firebaseプロジェクト**: admin-webの既存設定を使用
2. **セキュリティルール**: 本番環境ではFirestore Security Rulesの設定が必要
3. **画像**: 現状プレースホルダー。将来的にFirebase Storageを使用
4. **認証**: この計画では未対応。別途実装が必要
5. **エラーハンドリング**: 各ページにローディング/エラー状態を追加

---

## 見積もり作業量

| Phase | 作業内容 | ファイル数 |
|-------|---------|-----------|
| Phase 1 | 基盤整備 | 3 |
| Phase 2 | サービス層 | 4 |
| Phase 3 | admin-web連携 | 3 |
| Phase 4 | online-shop連携 | 5 |
| Phase 5 | データ投入 | 1 |
| **合計** | | **16ファイル** |
