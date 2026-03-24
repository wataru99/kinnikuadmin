import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

export interface Hotspot {
  id: string;
  muscleGroup?: string;
  muscleName?: string;
  customImagePath?: string;
  trainingMediaURLs?: string[];
  imageUrl?: string;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * ユーザーのホットスポット（トレーニング）一覧を取得
 */
export async function getUserHotspots(userId: string): Promise<Hotspot[]> {
  const trainingsRef = collection(db, "users", userId, "trainings");
  const snapshot = await getDocs(trainingsRef);

  const hotspots: Hotspot[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    hotspots.push({
      id: docSnap.id,
      muscleGroup: data.muscleGroup,
      muscleName: data.muscleName,
      customImagePath: data.customImagePath,
      trainingMediaURLs: data.trainingMediaURLs,
      imageUrl: data.imageUrl,
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(),
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
    });
  });

  hotspots.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return hotspots;
}

/**
 * Firebase Storage のURLからパスを抽出して画像を削除
 */
async function deleteStorageImage(url: string): Promise<void> {
  if (!url || !storage) return;

  try {
    // Firebase Storage URL からパスを抽出
    // 形式: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
    const match = url.match(/\/o\/([^?]+)/);
    if (match) {
      const path = decodeURIComponent(match[1]);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error("画像削除エラー:", error);
    // 既に削除済みの場合はエラーを無視
  }
}

/**
 * サブコレクションのドキュメントを全削除
 */
async function deleteSubcollection(
  parentPath: string,
  subcollectionName: string
): Promise<void> {
  const subRef = collection(db, parentPath, subcollectionName);
  const snapshot = await getDocs(subRef);
  const deletePromises = snapshot.docs.map((docSnap) =>
    deleteDoc(docSnap.ref)
  );
  await Promise.all(deletePromises);
}

/**
 * ホットスポットの完全削除
 * - users/{userId}/trainings/{trainingId}
 * - latest_muscles (userId一致 → userTraining.id == trainingId)
 * - latest_muscle_posts/{同じdocId}
 * - users/{userId}/post_index/{docId}
 * - Firebase Storage 画像
 */
export async function deleteHotspotComplete(
  userId: string,
  trainingId: string
): Promise<void> {
  // 1. users/{userId}/trainings/{trainingId} を削除
  const trainingDocRef = doc(db, "users", userId, "trainings", trainingId);
  await deleteDoc(trainingDocRef);

  // 2. latest_muscles で userId 一致を検索し、userTraining.id == trainingId のものを削除
  const latestMusclesRef = collection(db, "latest_muscles");
  const q = query(latestMusclesRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);

  const imageUrls: string[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const userTraining = data.userTraining;

    if (userTraining && userTraining.id === trainingId) {
      const docId = docSnap.id;

      // 画像URLを収集
      if (userTraining.customImagePath)
        imageUrls.push(userTraining.customImagePath);
      if (
        userTraining.trainingMediaURLs &&
        Array.isArray(userTraining.trainingMediaURLs)
      ) {
        imageUrls.push(...userTraining.trainingMediaURLs);
      }
      if (data.imageUrl) imageUrls.push(data.imageUrl);

      // サブコレクション削除
      await deleteSubcollection(`latest_muscles/${docId}`, "comments");
      await deleteSubcollection(`latest_muscles/${docId}`, "reports");

      // latest_muscles/{docId} 削除
      await deleteDoc(doc(db, "latest_muscles", docId));

      // latest_muscle_posts/{docId} 削除
      try {
        await deleteDoc(doc(db, "latest_muscle_posts", docId));
      } catch (error) {
        console.error("latest_muscle_posts 削除エラー:", error);
      }

      // users/{userId}/post_index/{docId} 削除
      try {
        await deleteDoc(doc(db, "users", userId, "post_index", docId));
      } catch (error) {
        console.error("post_index 削除エラー:", error);
      }
    }
  }

  // 3. Firebase Storage から画像削除
  const uniqueUrls = Array.from(new Set(imageUrls));
  await Promise.all(uniqueUrls.map((url) => deleteStorageImage(url)));
}

/**
 * latest_muscles のドキュメントIDから逆引き削除（ホットスポット管理ページ用）
 */
export async function deleteLatestMuscleById(muscleId: string): Promise<void> {
  const docRef = doc(db, "latest_muscles", muscleId);

  // ドキュメントデータを取得して関連情報を収集
  const { getDoc } = await import("firebase/firestore");
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("ドキュメントが見つかりません");
  }

  const data = docSnap.data();
  const userId = data.userId;
  const userTraining = data.userTraining;
  const trainingId = userTraining?.id;

  const imageUrls: string[] = [];
  if (userTraining?.customImagePath)
    imageUrls.push(userTraining.customImagePath);
  if (
    userTraining?.trainingMediaURLs &&
    Array.isArray(userTraining.trainingMediaURLs)
  ) {
    imageUrls.push(...userTraining.trainingMediaURLs);
  }
  if (data.imageUrl) imageUrls.push(data.imageUrl);

  // サブコレクション削除
  await deleteSubcollection(`latest_muscles/${muscleId}`, "comments");
  await deleteSubcollection(`latest_muscles/${muscleId}`, "reports");

  // latest_muscles/{muscleId} 削除
  await deleteDoc(docRef);

  // latest_muscle_posts/{muscleId} 削除
  try {
    await deleteDoc(doc(db, "latest_muscle_posts", muscleId));
  } catch (error) {
    console.error("latest_muscle_posts 削除エラー:", error);
  }

  // users/{userId}/post_index/{muscleId} 削除
  if (userId) {
    try {
      await deleteDoc(doc(db, "users", userId, "post_index", muscleId));
    } catch (error) {
      console.error("post_index 削除エラー:", error);
    }
  }

  // users/{userId}/trainings/{trainingId} 削除
  if (userId && trainingId) {
    try {
      await deleteDoc(doc(db, "users", userId, "trainings", trainingId));
    } catch (error) {
      console.error("training 削除エラー:", error);
    }
  }

  // Firebase Storage から画像削除
  const uniqueUrls = Array.from(new Set(imageUrls));
  await Promise.all(uniqueUrls.map((url) => deleteStorageImage(url)));
}
