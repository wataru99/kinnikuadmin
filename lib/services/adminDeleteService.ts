import { doc, getDoc, deleteDoc, collection, getDocs, updateDoc, deleteField } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

/**
 * Firebase Storage の URL から画像を削除
 * URLが無効な場合やすでに削除済みの場合はエラーを無視
 */
async function deleteStorageImage(url: string): Promise<void> {
  if (!storage || !url) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    // 既に削除済み or 無効なURLは無視
    console.warn("Storage画像削除スキップ:", error);
  }
}

/**
 * サブコレクションの全ドキュメントを削除
 */
async function deleteSubcollection(parentPath: string, subcollectionName: string): Promise<number> {
  const subcollectionRef = collection(db, parentPath, subcollectionName);
  const snapshot = await getDocs(subcollectionRef);
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(docSnap.ref);
    count++;
  }
  return count;
}

// ============================================================
// コミュニティ投稿の管理者削除（画像 + 返信カスケード削除）
// ============================================================
export async function adminDeleteCommunityPost(postId: string): Promise<void> {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  const data = postSnap.data();

  // Storage画像を削除
  if (data?.imageURL && typeof data.imageURL === "string" && data.imageURL.startsWith("https://")) {
    await deleteStorageImage(data.imageURL);
  }

  // repliesサブコレクションを全削除
  await deleteSubcollection(`posts/${postId}`, "replies");

  // reportsサブコレクションも削除
  await deleteSubcollection(`posts/${postId}`, "reports");

  // posts/{postId} を削除
  await deleteDoc(postRef);
}

// ============================================================
// コミュニティ返信の管理者削除
// ============================================================
export async function adminDeleteReply(postId: string, replyId: string): Promise<void> {
  const replyRef = doc(db, "posts", postId, "replies", replyId);
  await deleteDoc(replyRef);

  // 親投稿のreplyCountをデクリメント
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);
  if (postSnap.exists()) {
    const currentCount = postSnap.data()?.replyCount || 0;
    await updateDoc(postRef, { replyCount: Math.max(0, currentCount - 1) });
  }
}

// ============================================================
// タイムライン投稿（latest_muscles）の管理者完全削除
// ============================================================
export async function adminDeleteLatestMuscle(muscleId: string): Promise<void> {
  const muscleRef = doc(db, "latest_muscles", muscleId);
  const postRef = doc(db, "latest_muscle_posts", muscleId);
  const muscleSnap = await getDoc(muscleRef);
  const data = muscleSnap.data();
  const userId = data?.userId as string | undefined;

  // Storage: customImagePath を削除
  if (data?.userTraining?.customImagePath) {
    const path = data.userTraining.customImagePath as string;
    if (path.startsWith("https://") || path.startsWith("gs://")) {
      await deleteStorageImage(path);
    }
  }

  // Storage: imageUrl（筋肉図鑑画像）を削除
  if (data?.imageUrl && typeof data.imageUrl === "string" && data.imageUrl.startsWith("https://firebasestorage")) {
    await deleteStorageImage(data.imageUrl);
  }

  // commentsサブコレクションを全削除
  await deleteSubcollection(`latest_muscles/${muscleId}`, "comments");

  // reportsサブコレクションを全削除
  await deleteSubcollection(`latest_muscles/${muscleId}`, "reports");

  // latest_muscles/{id} 削除
  await deleteDoc(muscleRef);

  // latest_muscle_posts/{id} 削除
  try { await deleteDoc(postRef); } catch {}

  // users/{userId}/post_index/{id} 削除
  if (userId) {
    try {
      const postIndexRef = doc(db, "users", userId, "post_index", muscleId);
      await deleteDoc(postIndexRef);
    } catch {}
  }
}

// ============================================================
// タイムライン投稿の画像のみ削除（投稿は残す）
// ============================================================
export async function adminDeleteHotspotImage(muscleId: string): Promise<void> {
  const muscleRef = doc(db, "latest_muscles", muscleId);
  const muscleSnap = await getDoc(muscleRef);
  const data = muscleSnap.data();
  if (!data) return;

  const userId = data.userId as string | undefined;

  // customImagePathをStorageから削除
  if (data.userTraining?.customImagePath) {
    const path = data.userTraining.customImagePath as string;
    if (path.startsWith("https://") || path.startsWith("gs://")) {
      await deleteStorageImage(path);
    }
  }

  // Firestoreのusertraining.customImagePathをクリア
  await updateDoc(muscleRef, { "userTraining.customImagePath": deleteField() });

  // 元のusers/{userId}/trainings のcustomImagePathもクリア
  if (userId && data.userTraining?.muscleGroup) {
    try {
      const muscleGroup = data.userTraining.muscleGroup as string;
      const trainingsRef = collection(db, "users", userId, "trainings");
      const trainingsSnap = await getDocs(trainingsRef);
      for (const tDoc of trainingsSnap.docs) {
        const tData = tDoc.data();
        if (tData.muscleGroup === muscleGroup) {
          await updateDoc(tDoc.ref, { customImagePath: deleteField() });
        }
      }
    } catch {}
  }
}
