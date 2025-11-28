import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";

const COLLECTION_NAME = "products";

// Firestore のドキュメントを Product 型に変換
function docToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: data.name as string,
    description: data.description as string,
    longDescription: data.longDescription as string | undefined,
    price: data.price as number,
    originalPrice: data.originalPrice as number | undefined,
    stock: data.stock as number,
    category: data.category as Product["category"],
    status: data.status as Product["status"],
    images: data.images as string[] | undefined,
    rating: data.rating as number | undefined,
    reviews: data.reviews as number | undefined,
    details: data.details as Product["details"],
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt as string,
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt as string,
  };
}

export type ProductFilter = {
  category?: Product["category"];
  status?: Product["status"];
};

// 商品一覧を取得
export async function getProducts(filter?: ProductFilter): Promise<Product[]> {
  if (!db) throw new Error("Firestore is not initialized");

  let q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));

  if (filter?.category) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("category", "==", filter.category),
      orderBy("createdAt", "desc")
    );
  }

  if (filter?.status) {
    q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", filter.status),
      orderBy("createdAt", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => docToProduct(doc.id, doc.data()));
}

// 商品詳細を取得
export async function getProductById(id: string): Promise<Product | null> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToProduct(snapshot.id, snapshot.data());
}

export type CreateProductData = Omit<Product, "id" | "createdAt" | "updatedAt">;

// 商品を作成
export async function createProduct(data: CreateProductData): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export type UpdateProductData = Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>;

// 商品を更新
export async function updateProduct(id: string, data: UpdateProductData): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// 商品を削除
export async function deleteProduct(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

// 在庫を更新
export async function updateStock(id: string, newStock: number): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    stock: newStock,
    status: newStock === 0 ? "out_of_stock" : "active",
    updatedAt: Timestamp.now(),
  });
}
