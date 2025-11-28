// 商品型定義
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: "supplement" | "equipment" | "wear" | "accessories" | "other";
  status: "active" | "inactive" | "out_of_stock";
  image?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    zipCode: string;
    prefecture: string;
    city: string;
    address: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: "credit_card" | "bank_transfer";
  paymentStatus: "pending" | "paid" | "failed";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type InventoryLog = {
  id: string;
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
};

// カテゴリ名のマッピング
export const categoryLabels: Record<Product["category"], string> = {
  supplement: "サプリメント",
  equipment: "トレーニング器具",
  wear: "ウェア",
  accessories: "アクセサリー",
  other: "その他",
};

// ステータス名のマッピング
export const statusLabels: Record<Product["status"], string> = {
  active: "販売中",
  inactive: "非公開",
  out_of_stock: "在庫切れ",
};

// 120個の商品モックデータ
export const mockProducts: Product[] = [
  // サプリメント (40商品)
  { id: "1", name: "プロテイン プレミアム ホエイ", description: "高品質なホエイプロテイン。筋肉の成長と回復をサポートします。", price: 4980, originalPrice: 5980, stock: 50, category: "supplement", status: "active", createdAt: "2024-01-15T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "2", name: "BCAA パウダー", description: "分岐鎖アミノ酸で筋肉疲労を軽減。トレーニング中の補給に最適。", price: 2980, stock: 35, category: "supplement", status: "active", createdAt: "2024-01-16T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "3", name: "クレアチン モノハイドレート", description: "瞬発力とパワーを向上させるクレアチンサプリメント。", price: 2480, stock: 0, category: "supplement", status: "out_of_stock", createdAt: "2024-01-17T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "4", name: "マルチビタミン", description: "必須ビタミンとミネラルを1粒で補給。健康維持に。", price: 1980, stock: 5, category: "supplement", status: "active", createdAt: "2024-01-18T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "5", name: "プレワークアウト エナジー", description: "トレーニング前の集中力とエネルギーをブースト。", price: 3480, stock: 28, category: "supplement", status: "active", createdAt: "2024-01-19T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "6", name: "カゼインプロテイン", description: "就寝前に最適なスローリリースプロテイン。", price: 4280, stock: 22, category: "supplement", status: "active", createdAt: "2024-01-20T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "7", name: "グルタミン パウダー", description: "免疫力と筋肉回復をサポートするアミノ酸。", price: 2680, stock: 45, category: "supplement", status: "active", createdAt: "2024-01-21T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "8", name: "EAAサプリメント", description: "必須アミノ酸9種類を配合。筋合成を促進。", price: 3280, stock: 18, category: "supplement", status: "active", createdAt: "2024-01-22T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "9", name: "HMBサプリメント", description: "筋肉分解を抑制し、筋力アップをサポート。", price: 3980, originalPrice: 4480, stock: 30, category: "supplement", status: "active", createdAt: "2024-01-23T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "10", name: "シトルリン マレート", description: "血流を促進し、パンプ感を向上。", price: 2180, stock: 40, category: "supplement", status: "active", createdAt: "2024-01-24T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "11", name: "オメガ3 フィッシュオイル", description: "EPA・DHAを高濃度配合。関節と心臓の健康に。", price: 2480, stock: 55, category: "supplement", status: "active", createdAt: "2024-01-25T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "12", name: "ビタミンD3", description: "筋力維持と骨の健康をサポート。", price: 1280, stock: 70, category: "supplement", status: "active", createdAt: "2024-01-26T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "13", name: "亜鉛サプリメント", description: "テストステロン産生と免疫機能をサポート。", price: 980, stock: 85, category: "supplement", status: "active", createdAt: "2024-01-27T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "14", name: "マグネシウム", description: "筋肉の収縮とリラックスをサポート。", price: 1180, stock: 60, category: "supplement", status: "active", createdAt: "2024-01-28T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "15", name: "アルギニン", description: "成長ホルモン分泌と血流を促進。", price: 1980, stock: 0, category: "supplement", status: "out_of_stock", createdAt: "2024-01-29T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "16", name: "カルニチン", description: "脂肪燃焼をサポートするアミノ酸。", price: 2280, stock: 42, category: "supplement", status: "active", createdAt: "2024-01-30T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "17", name: "コラーゲンペプチド", description: "関節と肌の健康をサポート。", price: 2880, stock: 33, category: "supplement", status: "active", createdAt: "2024-02-01T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "18", name: "ベータアラニン", description: "持久力とパフォーマンスを向上。", price: 1880, stock: 25, category: "supplement", status: "active", createdAt: "2024-02-02T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "19", name: "タウリン", description: "エネルギー代謝と心臓機能をサポート。", price: 1480, stock: 48, category: "supplement", status: "active", createdAt: "2024-02-03T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "20", name: "アシュワガンダ", description: "ストレス軽減とテストステロンサポート。", price: 2180, stock: 38, category: "supplement", status: "active", createdAt: "2024-02-04T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "21", name: "ソイプロテイン", description: "植物性タンパク質で乳製品不使用。", price: 3480, stock: 20, category: "supplement", status: "active", createdAt: "2024-02-05T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "22", name: "ピープロテイン", description: "エンドウ豆由来のプロテイン。アレルギー対応。", price: 3680, stock: 15, category: "supplement", status: "active", createdAt: "2024-02-06T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "23", name: "ウェイトゲイナー", description: "体重増加を目指す方に。高カロリープロテイン。", price: 5480, originalPrice: 5980, stock: 12, category: "supplement", status: "active", createdAt: "2024-02-07T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "24", name: "ダイエットプロテイン", description: "低カロリー・高タンパクのダイエットサポート。", price: 4180, stock: 28, category: "supplement", status: "active", createdAt: "2024-02-08T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "25", name: "プロテインバー チョコ味", description: "持ち運びに便利なプロテインバー。20g配合。", price: 298, stock: 200, category: "supplement", status: "active", createdAt: "2024-02-09T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "26", name: "プロテインバー バニラ味", description: "甘さ控えめのバニラフレーバー。", price: 298, stock: 180, category: "supplement", status: "active", createdAt: "2024-02-10T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "27", name: "MCTオイル", description: "ケトジェニックダイエットに最適。即エネルギー源。", price: 2480, stock: 35, category: "supplement", status: "active", createdAt: "2024-02-11T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "28", name: "CLA（共役リノール酸）", description: "脂肪代謝をサポートする不飽和脂肪酸。", price: 1980, stock: 40, category: "supplement", status: "active", createdAt: "2024-02-12T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "29", name: "テストステロンブースター", description: "自然なテストステロンレベルをサポート。", price: 4980, stock: 3, category: "supplement", status: "active", createdAt: "2024-02-13T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "30", name: "ジョイントサポート", description: "グルコサミン・コンドロイチン配合。関節の健康に。", price: 2880, stock: 25, category: "supplement", status: "active", createdAt: "2024-02-14T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "31", name: "睡眠サポートサプリ", description: "ZMAとメラトニン配合。回復力を高める睡眠を。", price: 2180, stock: 45, category: "supplement", status: "active", createdAt: "2024-02-15T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "32", name: "イントラワークアウト", description: "トレーニング中の栄養補給に最適なドリンク。", price: 3280, stock: 22, category: "supplement", status: "active", createdAt: "2024-02-16T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "33", name: "ポストワークアウト", description: "トレーニング後の回復を促進するブレンド。", price: 3480, stock: 18, category: "supplement", status: "active", createdAt: "2024-02-17T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "34", name: "エレクトロライト", description: "電解質補給で脱水を防止。汗をかくトレーニングに。", price: 1680, stock: 55, category: "supplement", status: "active", createdAt: "2024-02-18T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "35", name: "ホエイアイソレート", description: "高純度のホエイプロテイン。脂質・糖質カット。", price: 5980, originalPrice: 6480, stock: 30, category: "supplement", status: "active", createdAt: "2024-02-19T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "36", name: "プロバイオティクス", description: "腸内環境を整える乳酸菌サプリ。", price: 1980, stock: 42, category: "supplement", status: "active", createdAt: "2024-02-20T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "37", name: "消化酵素", description: "タンパク質の消化吸収をサポート。", price: 1780, stock: 38, category: "supplement", status: "active", createdAt: "2024-02-21T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "38", name: "ビタミンB群", description: "エネルギー代謝に必須のビタミン群。", price: 1280, stock: 65, category: "supplement", status: "active", createdAt: "2024-02-22T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "39", name: "ビタミンC", description: "抗酸化作用と免疫サポート。", price: 980, stock: 80, category: "supplement", status: "active", createdAt: "2024-02-23T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "40", name: "鉄分サプリ", description: "貧血予防と酸素運搬能力をサポート。", price: 1080, stock: 50, category: "supplement", status: "active", createdAt: "2024-02-24T10:00:00", updatedAt: "2024-03-20T10:00:00" },

  // トレーニング器具 (40商品)
  { id: "41", name: "トレーニングベルト レザー", description: "腰をしっかりサポートする本革ベルト。スクワット・デッドリフトに。", price: 3980, stock: 25, category: "equipment", status: "active", createdAt: "2024-01-15T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "42", name: "リストラップ", description: "手首を保護するラップ。ベンチプレスに必須。", price: 1480, originalPrice: 1980, stock: 100, category: "equipment", status: "active", createdAt: "2024-01-16T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "43", name: "ダンベルセット 20kg", description: "可変式ダンベル。初心者から中級者向け。", price: 8980, originalPrice: 9800, stock: 15, category: "equipment", status: "active", createdAt: "2024-01-17T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "44", name: "ダンベルセット 40kg", description: "本格的なトレーニングに。上級者向け可変式。", price: 15800, stock: 8, category: "equipment", status: "active", createdAt: "2024-01-18T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "45", name: "バーベルセット", description: "オリンピックバーベル20kg + プレート。", price: 24800, originalPrice: 29800, stock: 5, category: "equipment", status: "active", createdAt: "2024-01-19T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "46", name: "トレーニンググローブ", description: "グリップ力を高め、手のひらを保護。", price: 2480, stock: 60, category: "equipment", status: "active", createdAt: "2024-01-20T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "47", name: "ヨガマット 10mm", description: "クッション性抜群の厚手マット。", price: 2980, stock: 40, category: "equipment", status: "active", createdAt: "2024-01-21T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "48", name: "ヨガマット 6mm", description: "持ち運びに便利な標準厚さ。", price: 1980, stock: 55, category: "equipment", status: "active", createdAt: "2024-01-22T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "49", name: "フォームローラー", description: "筋膜リリースで疲労回復。", price: 2480, stock: 45, category: "equipment", status: "active", createdAt: "2024-01-23T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "50", name: "プッシュアップバー", description: "より深い可動域でプッシュアップ。", price: 1280, stock: 70, category: "equipment", status: "active", createdAt: "2024-01-24T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "51", name: "腹筋ローラー", description: "コア強化に最適なアブローラー。", price: 1480, stock: 65, category: "equipment", status: "active", createdAt: "2024-01-25T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "52", name: "チンニングバー", description: "ドア取り付け型の懸垂バー。", price: 3980, stock: 20, category: "equipment", status: "active", createdAt: "2024-01-26T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "53", name: "チンニングスタンド", description: "自立式の懸垂スタンド。ディップスも可能。", price: 16800, originalPrice: 19800, stock: 6, category: "equipment", status: "active", createdAt: "2024-01-27T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "54", name: "レジスタンスバンド セット", description: "5段階の強度で全身トレーニング。", price: 2980, stock: 50, category: "equipment", status: "active", createdAt: "2024-01-28T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "55", name: "ケトルベル 8kg", description: "ファンクショナルトレーニングに。初心者向け。", price: 3480, stock: 25, category: "equipment", status: "active", createdAt: "2024-01-29T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "56", name: "ケトルベル 16kg", description: "中級者向けの重量。スイングトレーニングに。", price: 5980, stock: 18, category: "equipment", status: "active", createdAt: "2024-01-30T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "57", name: "ケトルベル 24kg", description: "上級者向け。本格的なケトルベルトレーニング。", price: 8980, stock: 10, category: "equipment", status: "active", createdAt: "2024-02-01T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "58", name: "メディシンボール 5kg", description: "体幹トレーニングとプライオメトリクスに。", price: 4980, stock: 22, category: "equipment", status: "active", createdAt: "2024-02-02T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "59", name: "バランスボール 65cm", description: "体幹強化とストレッチに。", price: 2480, stock: 35, category: "equipment", status: "active", createdAt: "2024-02-03T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "60", name: "バランスボード", description: "バランス感覚と足首強化に。", price: 3980, stock: 28, category: "equipment", status: "active", createdAt: "2024-02-04T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "61", name: "ジャンプロープ", description: "スピードロープで有酸素運動。", price: 1280, stock: 80, category: "equipment", status: "active", createdAt: "2024-02-05T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "62", name: "アンクルウェイト 2kg", description: "足首に装着してトレーニング強度アップ。", price: 1980, stock: 45, category: "equipment", status: "active", createdAt: "2024-02-06T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "63", name: "アンクルウェイト 5kg", description: "より重い負荷で下半身強化。", price: 2980, stock: 30, category: "equipment", status: "active", createdAt: "2024-02-07T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "64", name: "リストウェイト 1kg", description: "手首に装着して上半身トレーニング。", price: 1480, stock: 50, category: "equipment", status: "active", createdAt: "2024-02-08T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "65", name: "パワーグリップ", description: "握力補助でより重い重量に挑戦。", price: 2980, stock: 0, category: "equipment", status: "out_of_stock", createdAt: "2024-02-09T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "66", name: "リフティングストラップ", description: "デッドリフトやローイングの握力補助に。", price: 1480, stock: 60, category: "equipment", status: "active", createdAt: "2024-02-10T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "67", name: "エルボースリーブ", description: "肘関節をサポートし保護。", price: 2480, stock: 35, category: "equipment", status: "active", createdAt: "2024-02-11T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "68", name: "ニースリーブ", description: "膝をサポートしスクワットをサポート。", price: 3480, stock: 28, category: "equipment", status: "active", createdAt: "2024-02-12T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "69", name: "パラレットバー", description: "Lシットやプランシェの練習に。", price: 4980, stock: 15, category: "equipment", status: "active", createdAt: "2024-02-13T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "70", name: "ディップスタンド", description: "上半身を鍛えるディップス専用。", price: 5980, stock: 12, category: "equipment", status: "active", createdAt: "2024-02-14T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "71", name: "プレートツリー", description: "ウェイトプレートを整理して収納。", price: 6980, stock: 8, category: "equipment", status: "active", createdAt: "2024-02-15T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "72", name: "ダンベルラック", description: "ダンベルを整理して収納。", price: 8980, stock: 5, category: "equipment", status: "active", createdAt: "2024-02-16T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "73", name: "フラットベンチ", description: "基本のトレーニングベンチ。", price: 9800, stock: 10, category: "equipment", status: "active", createdAt: "2024-02-17T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "74", name: "インクラインベンチ", description: "角度調整可能なトレーニングベンチ。", price: 14800, originalPrice: 16800, stock: 7, category: "equipment", status: "active", createdAt: "2024-02-18T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "75", name: "スクワットラック", description: "安全にスクワットを行うためのラック。", price: 29800, stock: 3, category: "equipment", status: "active", createdAt: "2024-02-19T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "76", name: "パワーラック", description: "本格的なホームジム用パワーラック。", price: 49800, stock: 2, category: "equipment", status: "active", createdAt: "2024-02-20T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "77", name: "トレーニングマット", description: "床を保護する衝撃吸収マット。", price: 4980, stock: 25, category: "equipment", status: "active", createdAt: "2024-02-21T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "78", name: "ストレッチポール", description: "背骨の調整とリラクゼーションに。", price: 3480, stock: 30, category: "equipment", status: "active", createdAt: "2024-02-22T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "79", name: "マッサージボール", description: "ピンポイントで筋肉をほぐす。", price: 980, stock: 100, category: "equipment", status: "active", createdAt: "2024-02-23T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "80", name: "マッサージガン", description: "電動マッサージで筋肉をリリース。", price: 12800, originalPrice: 14800, stock: 15, category: "equipment", status: "active", createdAt: "2024-02-24T10:00:00", updatedAt: "2024-03-20T10:00:00" },

  // ウェア (25商品)
  { id: "81", name: "トレーニングTシャツ ブラック", description: "速乾性素材のトレーニング用Tシャツ。", price: 2480, stock: 45, category: "wear", status: "active", createdAt: "2024-01-15T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "82", name: "トレーニングTシャツ ホワイト", description: "速乾性素材のトレーニング用Tシャツ。", price: 2480, stock: 40, category: "wear", status: "active", createdAt: "2024-01-16T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "83", name: "トレーニングTシャツ グレー", description: "速乾性素材のトレーニング用Tシャツ。", price: 2480, stock: 35, category: "wear", status: "active", createdAt: "2024-01-17T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "84", name: "コンプレッションシャツ", description: "筋肉をサポートするタイトフィット。", price: 3980, stock: 30, category: "wear", status: "active", createdAt: "2024-01-18T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "85", name: "タンクトップ ブラック", description: "動きやすいノースリーブデザイン。", price: 1980, stock: 50, category: "wear", status: "active", createdAt: "2024-01-19T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "86", name: "タンクトップ ホワイト", description: "動きやすいノースリーブデザイン。", price: 1980, stock: 45, category: "wear", status: "active", createdAt: "2024-01-20T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "87", name: "トレーニングショーツ", description: "ストレッチ素材で動きやすい。", price: 2980, stock: 55, category: "wear", status: "active", createdAt: "2024-01-21T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "88", name: "トレーニングパンツ", description: "ジム通いに最適なジョガーパンツ。", price: 3980, stock: 40, category: "wear", status: "active", createdAt: "2024-01-22T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "89", name: "コンプレッションタイツ", description: "脚をサポートするロングタイツ。", price: 3480, stock: 35, category: "wear", status: "active", createdAt: "2024-01-23T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "90", name: "トレーニングパーカー", description: "ウォームアップに最適なパーカー。", price: 4980, stock: 25, category: "wear", status: "active", createdAt: "2024-01-24T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "91", name: "ジップアップジャケット", description: "軽量で通気性の良いジャケット。", price: 5480, stock: 20, category: "wear", status: "active", createdAt: "2024-01-25T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "92", name: "ストリンガータンク", description: "ボディビルダー向けの深いカットタンク。", price: 2480, stock: 30, category: "wear", status: "active", createdAt: "2024-01-26T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "93", name: "トレーニングキャップ", description: "汗を吸収するスポーツキャップ。", price: 1980, stock: 60, category: "wear", status: "active", createdAt: "2024-01-27T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "94", name: "ヘッドバンド", description: "汗止めスポーツヘッドバンド。", price: 980, stock: 80, category: "wear", status: "active", createdAt: "2024-01-28T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "95", name: "リストバンド", description: "汗を吸収するリストバンド 2個セット。", price: 780, stock: 90, category: "wear", status: "active", createdAt: "2024-01-29T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "96", name: "トレーニングソックス 3足セット", description: "クッション性のあるスポーツソックス。", price: 1480, stock: 70, category: "wear", status: "active", createdAt: "2024-01-30T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "97", name: "レディース スポーツブラ", description: "サポート力のあるスポーツブラ。", price: 3480, stock: 40, category: "wear", status: "active", createdAt: "2024-02-01T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "98", name: "レディース レギンス", description: "ハイウエストで動きやすいレギンス。", price: 3980, stock: 35, category: "wear", status: "active", createdAt: "2024-02-02T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "99", name: "レディース トレーニングトップ", description: "女性向けフィットネスウェア。", price: 2980, stock: 45, category: "wear", status: "active", createdAt: "2024-02-03T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "100", name: "レディース タンクトップ", description: "女性向けのフィットタンクトップ。", price: 2480, stock: 50, category: "wear", status: "active", createdAt: "2024-02-04T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "101", name: "トレーニングシューズ", description: "安定性重視のジムシューズ。", price: 8980, stock: 20, category: "wear", status: "active", createdAt: "2024-02-05T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "102", name: "デッドリフトシューズ", description: "フラットソールでデッドリフトに最適。", price: 6980, stock: 15, category: "wear", status: "active", createdAt: "2024-02-06T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "103", name: "スクワットシューズ", description: "ヒールリフト付きでスクワットに最適。", price: 12800, stock: 10, category: "wear", status: "active", createdAt: "2024-02-07T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "104", name: "アームスリーブ", description: "腕をサポートするコンプレッションスリーブ。", price: 1980, stock: 40, category: "wear", status: "active", createdAt: "2024-02-08T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "105", name: "カーフスリーブ", description: "ふくらはぎをサポートするスリーブ。", price: 1980, stock: 35, category: "wear", status: "active", createdAt: "2024-02-09T10:00:00", updatedAt: "2024-03-20T10:00:00" },

  // アクセサリー (15商品)
  { id: "106", name: "シェイカーボトル 700ml", description: "プロテインを混ぜるのに最適なシェイカー。", price: 980, stock: 120, category: "accessories", status: "active", createdAt: "2024-01-15T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "107", name: "シェイカーボトル 1000ml", description: "大容量のシェイカーボトル。", price: 1280, stock: 80, category: "accessories", status: "active", createdAt: "2024-01-16T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "108", name: "ジムバッグ", description: "大容量のトレーニング用バッグ。", price: 4980, stock: 30, category: "accessories", status: "active", createdAt: "2024-01-17T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "109", name: "ジムバックパック", description: "シューズ収納付きリュック。", price: 5980, stock: 25, category: "accessories", status: "active", createdAt: "2024-01-18T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "110", name: "ウォーターボトル 1L", description: "BPAフリーの大容量ボトル。", price: 1480, stock: 65, category: "accessories", status: "active", createdAt: "2024-01-19T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "111", name: "ウォーターボトル 2L", description: "1日の水分摂取量を管理。", price: 1980, stock: 45, category: "accessories", status: "active", createdAt: "2024-01-20T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "112", name: "サプリメントケース", description: "携帯用のサプリ収納ケース。", price: 680, stock: 100, category: "accessories", status: "active", createdAt: "2024-01-21T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "113", name: "ピルケース 7日分", description: "1週間分のサプリを管理。", price: 480, stock: 120, category: "accessories", status: "active", createdAt: "2024-01-22T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "114", name: "ジムタオル", description: "速乾性のスポーツタオル。", price: 980, stock: 80, category: "accessories", status: "active", createdAt: "2024-01-23T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "115", name: "トレーニングノート", description: "ワークアウトを記録するノート。", price: 1280, stock: 55, category: "accessories", status: "active", createdAt: "2024-01-24T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "116", name: "フィットネストラッカー", description: "心拍数・歩数を計測するバンド。", price: 4980, stock: 20, category: "accessories", status: "active", createdAt: "2024-01-25T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "117", name: "体組成計", description: "体脂肪率・筋肉量を測定。", price: 5980, stock: 15, category: "accessories", status: "active", createdAt: "2024-01-26T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "118", name: "メジャー 巻尺", description: "体のサイズを測定。", price: 380, stock: 150, category: "accessories", status: "active", createdAt: "2024-01-27T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "119", name: "ワイヤレスイヤホン", description: "トレーニング用防水イヤホン。", price: 6980, stock: 18, category: "accessories", status: "active", createdAt: "2024-01-28T10:00:00", updatedAt: "2024-03-20T10:00:00" },
  { id: "120", name: "液体チョーク", description: "手の滑りを防ぐチョーク。ジムOK。", price: 1280, stock: 40, category: "accessories", status: "active", createdAt: "2024-01-29T10:00:00", updatedAt: "2024-03-20T10:00:00" },
];

// 注文モックデータ
export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2024-001",
    customer: { name: "田中太郎", email: "tanaka@example.com", phone: "090-1234-5678" },
    shippingAddress: { zipCode: "150-0001", prefecture: "東京都", city: "渋谷区", address: "神宮前1-2-3" },
    items: [
      { productId: "1", productName: "プロテイン プレミアム ホエイ", quantity: 2, price: 4980 },
      { productId: "42", productName: "リストラップ", quantity: 1, price: 1480 },
    ],
    subtotal: 11440,
    tax: 1144,
    shipping: 0,
    total: 12584,
    paymentMethod: "credit_card",
    paymentStatus: "paid",
    status: "delivered",
    createdAt: "2024-03-20T10:30:00",
    updatedAt: "2024-03-22T15:00:00",
  },
  {
    id: "2",
    orderNumber: "ORD-2024-002",
    customer: { name: "佐藤花子", email: "sato@example.com", phone: "080-2345-6789" },
    shippingAddress: { zipCode: "530-0001", prefecture: "大阪府", city: "北区", address: "梅田4-5-6" },
    items: [
      { productId: "41", productName: "トレーニングベルト レザー", quantity: 1, price: 3980 },
    ],
    subtotal: 3980,
    tax: 398,
    shipping: 500,
    total: 4878,
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    status: "shipped",
    createdAt: "2024-03-21T14:20:00",
    updatedAt: "2024-03-22T09:00:00",
  },
  {
    id: "3",
    orderNumber: "ORD-2024-003",
    customer: { name: "鈴木一郎", email: "suzuki@example.com", phone: "070-3456-7890" },
    shippingAddress: { zipCode: "220-0012", prefecture: "神奈川県", city: "横浜市西区", address: "みなとみらい7-8-9" },
    items: [
      { productId: "43", productName: "ダンベルセット 20kg", quantity: 1, price: 8980 },
      { productId: "46", productName: "トレーニンググローブ", quantity: 2, price: 2480 },
    ],
    subtotal: 13940,
    tax: 1394,
    shipping: 0,
    total: 15334,
    paymentMethod: "credit_card",
    paymentStatus: "paid",
    status: "processing",
    createdAt: "2024-03-22T09:15:00",
    updatedAt: "2024-03-22T09:15:00",
  },
  {
    id: "4",
    orderNumber: "ORD-2024-004",
    customer: { name: "高橋美咲", email: "takahashi@example.com", phone: "090-4567-8901" },
    shippingAddress: { zipCode: "460-0008", prefecture: "愛知県", city: "名古屋市中区", address: "栄10-11-12" },
    items: [
      { productId: "5", productName: "プレワークアウト エナジー", quantity: 1, price: 3480 },
      { productId: "4", productName: "マルチビタミン", quantity: 2, price: 1980 },
    ],
    subtotal: 7440,
    tax: 744,
    shipping: 500,
    total: 8684,
    paymentMethod: "credit_card",
    paymentStatus: "pending",
    status: "pending",
    createdAt: "2024-03-22T16:45:00",
    updatedAt: "2024-03-22T16:45:00",
  },
  {
    id: "5",
    orderNumber: "ORD-2024-005",
    customer: { name: "山本健太", email: "yamamoto@example.com", phone: "080-5678-9012" },
    shippingAddress: { zipCode: "812-0011", prefecture: "福岡県", city: "博多区", address: "博多駅前13-14-15" },
    items: [
      { productId: "47", productName: "ヨガマット 10mm", quantity: 1, price: 2980 },
    ],
    subtotal: 2980,
    tax: 298,
    shipping: 500,
    total: 3778,
    paymentMethod: "bank_transfer",
    paymentStatus: "pending",
    status: "pending",
    createdAt: "2024-03-22T18:00:00",
    updatedAt: "2024-03-22T18:00:00",
  },
  {
    id: "6",
    orderNumber: "ORD-2024-006",
    customer: { name: "伊藤麻衣", email: "ito@example.com", phone: "070-6789-0123" },
    shippingAddress: { zipCode: "060-0001", prefecture: "北海道", city: "札幌市中央区", address: "北1条西16-17-18" },
    items: [
      { productId: "1", productName: "プロテイン プレミアム ホエイ", quantity: 3, price: 4980 },
    ],
    subtotal: 14940,
    tax: 1494,
    shipping: 0,
    total: 16434,
    paymentMethod: "credit_card",
    paymentStatus: "paid",
    status: "confirmed",
    createdAt: "2024-03-22T20:30:00",
    updatedAt: "2024-03-22T21:00:00",
  },
];

// 在庫変動履歴モックデータ
export const mockInventoryLogs: InventoryLog[] = [
  { id: "1", productId: "1", productName: "プロテイン プレミアム ホエイ", type: "out", quantity: 2, previousStock: 52, newStock: 50, reason: "注文 ORD-2024-001", createdAt: "2024-03-20T10:30:00" },
  { id: "2", productId: "42", productName: "リストラップ", type: "out", quantity: 1, previousStock: 101, newStock: 100, reason: "注文 ORD-2024-001", createdAt: "2024-03-20T10:30:00" },
  { id: "3", productId: "41", productName: "トレーニングベルト レザー", type: "out", quantity: 1, previousStock: 26, newStock: 25, reason: "注文 ORD-2024-002", createdAt: "2024-03-21T14:20:00" },
  { id: "4", productId: "1", productName: "プロテイン プレミアム ホエイ", type: "in", quantity: 100, previousStock: 50, newStock: 150, reason: "入荷", createdAt: "2024-03-21T09:00:00" },
  { id: "5", productId: "3", productName: "クレアチン モノハイドレート", type: "adjustment", quantity: -5, previousStock: 5, newStock: 0, reason: "棚卸し調整", createdAt: "2024-03-19T17:00:00" },
  { id: "6", productId: "4", productName: "マルチビタミン", type: "out", quantity: 10, previousStock: 15, newStock: 5, reason: "注文一括処理", createdAt: "2024-03-18T14:00:00" },
  { id: "7", productId: "15", productName: "アルギニン", type: "out", quantity: 20, previousStock: 20, newStock: 0, reason: "注文一括処理", createdAt: "2024-03-17T11:00:00" },
];
