import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Order, OrderItem } from "../types";

const COLLECTION_NAME = "orders";

// Firestore のドキュメントを Order 型に変換
function docToOrder(id: string, data: Record<string, unknown>): Order {
  return {
    id,
    orderNumber: data.orderNumber as string,
    customer: data.customer as Order["customer"],
    shippingAddress: data.shippingAddress as Order["shippingAddress"],
    items: data.items as OrderItem[],
    subtotal: data.subtotal as number,
    tax: data.tax as number,
    shipping: data.shipping as number,
    total: data.total as number,
    paymentMethod: data.paymentMethod as Order["paymentMethod"],
    paymentStatus: data.paymentStatus as Order["paymentStatus"],
    status: data.status as Order["status"],
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt as string,
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt as string,
  };
}

export type OrderFilter = {
  status?: Order["status"];
  paymentStatus?: Order["paymentStatus"];
};

// 注文一覧を取得
export async function getOrders(filter?: OrderFilter): Promise<Order[]> {
  if (!db) throw new Error("Firestore is not initialized");

  let q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));

  if (filter?.status) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", filter.status),
      orderBy("createdAt", "desc")
    );
  }

  if (filter?.paymentStatus) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("paymentStatus", "==", filter.paymentStatus),
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToOrder(doc.id, doc.data()));
}

// 注文詳細を取得
export async function getOrderById(id: string): Promise<Order | null> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToOrder(snapshot.id, snapshot.data());
}

// 注文番号で取得
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (!db) throw new Error("Firestore is not initialized");

  const q = query(
    collection(db, COLLECTION_NAME),
    where("orderNumber", "==", orderNumber)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return docToOrder(doc.id, doc.data());
}

export type CreateOrderData = Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">;

// 注文番号を生成
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `ORD-${year}${month}${day}-${random}`;
}

// 注文を作成
export async function createOrder(data: CreateOrderData): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  const now = Timestamp.now();
  const orderNumber = generateOrderNumber();

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

// 注文ステータスを更新
export async function updateOrderStatus(
  id: string,
  status: Order["status"]
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

// 支払いステータスを更新
export async function updatePaymentStatus(
  id: string,
  paymentStatus: Order["paymentStatus"]
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    paymentStatus,
    updatedAt: Timestamp.now(),
  });
}

// 注文統計を取得
export async function getOrderStats(): Promise<{
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  totalSales: number;
}> {
  if (!db) throw new Error("Firestore is not initialized");

  const orders = await getOrders();

  return {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter(
      (o) => o.status === "processing" || o.status === "confirmed"
    ).length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalSales: orders.reduce((sum, o) => sum + o.total, 0),
  };
}
