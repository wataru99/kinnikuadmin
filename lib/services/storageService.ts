import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "../firebase";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 画像をアップロードして URL を返す
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized");

  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("ファイルサイズは10MB以下にしてください");
  }

  // ファイル形式チェック
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("対応形式: JPEG, PNG, GIF, WebP");
  }

  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "jpg";
  const fileName = `${timestamp}.${extension}`;
  const storageRef = ref(storage, `products/${productId}/${fileName}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return downloadURL;
}

// 複数の画像をアップロード
export async function uploadProductImages(
  files: File[],
  productId: string,
  existingImages: string[] = []
): Promise<string[]> {
  const totalCount = existingImages.length + files.length;
  if (totalCount > MAX_IMAGES) {
    throw new Error(`画像は最大${MAX_IMAGES}枚までです`);
  }

  const uploadPromises = files.map((file) => uploadProductImage(file, productId));
  const newUrls = await Promise.all(uploadPromises);

  return [...existingImages, ...newUrls];
}

// 画像を削除
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!storage) throw new Error("Firebase Storage is not initialized");

  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("画像削除エラー:", error);
    // 既に削除済みの場合はエラーを無視
  }
}

export { MAX_IMAGES };
