// 商品型定義
export type Product = {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: "supplement" | "equipment" | "wear" | "accessories" | "other";
  status: "active" | "inactive" | "out_of_stock";
  images?: string[];  // 最大5枚の画像URL
  rating?: number;
  reviews?: number;
  details?: {
    content?: string;
    ingredients?: string;
    material?: string;
    size?: string;
    weight?: string;
    manufacturer?: string;
    origin?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
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
    building?: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: "credit_card" | "bank_transfer" | "convenience_store";
  paymentStatus: "pending" | "paid" | "failed";
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
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

// 注文ステータス名のマッピング
export const orderStatusLabels: Record<Order["status"], string> = {
  pending: "新規注文",
  confirmed: "確認済み",
  processing: "処理中",
  shipped: "発送済み",
  delivered: "配達完了",
  cancelled: "キャンセル",
};

// 支払いステータス名のマッピング
export const paymentStatusLabels: Record<Order["paymentStatus"], string> = {
  pending: "未入金",
  paid: "入金済み",
  failed: "失敗",
};

// 支払い方法名のマッピング
export const paymentMethodLabels: Record<Order["paymentMethod"], string> = {
  credit_card: "クレジットカード",
  bank_transfer: "銀行振込",
  convenience_store: "コンビニ払い",
};
