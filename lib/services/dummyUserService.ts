import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../firebase";
import {
  DummyUser,
  CreateDummyUserData,
  UpdateDummyUserData,
  DummyPost,
  CreateDummyPostData,
  DummyMuscle,
  CreateDummyMuscleData,
  BulkActionConfig,
  UserTraining,
  CreateUserTrainingData,
  UpdateUserTrainingData,
  TrainingExercise,
} from "../types/dummyUser";

// ========== ダミーユーザー CRUD ==========

function generateSakuraId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `sakura_${result}`;
}

export async function getDummyUsers(): Promise<DummyUser[]> {
  if (!db) throw new Error("Firestore is not initialized");

  const q = query(
    collection(db, "users"),
    where("isSakura", "==", true)
  );
  const snapshot = await getDocs(q);

  const users = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email || "",
      displayName: data.displayName || "",
      gender: data.gender || "male",
      role: "viewer" as const,
      verificationStatus: "unverified" as const,
      isSubscribed: false as const,
      hasFemaleTrainerAccess: false as const,
      isSakura: true as const,
      bio: data.bio,
      trainingExperience: data.trainingExperience,
      currentWeight: data.currentWeight,
      currentBodyFat: data.currentBodyFat,
      height: data.height,
      isHidden: data.isHidden === true,
      profileImageURL: data.profileImageURL,
      myTrainingIconURL: data.myTrainingIconURL,
      createdAt: typeof data.createdAt === "number"
        ? data.createdAt
        : data.createdAt instanceof Timestamp
          ? data.createdAt.seconds
          : Date.now() / 1000,
      updatedAt: typeof data.updatedAt === "number"
        ? data.updatedAt
        : data.updatedAt instanceof Timestamp
          ? data.updatedAt.seconds
          : Date.now() / 1000,
    };
  });

  // クライアントサイドで降順ソート（複合インデックス不要）
  users.sort((a, b) => b.createdAt - a.createdAt);
  return users;
}

export async function createDummyUser(data: CreateDummyUserData): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  const sakuraId = generateSakuraId();
  const now = Date.now() / 1000; // epoch秒

  const userData: Record<string, unknown> = {
    id: sakuraId,
    email: `${sakuraId}@sakura.local`,
    displayName: data.displayName,
    gender: data.gender,
    role: "viewer",
    verificationStatus: "unverified",
    isSubscribed: false,
    hasFemaleTrainerAccess: false,
    createdAt: now,
    updatedAt: now,
    isSakura: true,
  };

  if (data.bio) userData.bio = data.bio;
  if (data.trainingExperience !== undefined) userData.trainingExperience = data.trainingExperience;
  if (data.currentWeight !== undefined) userData.currentWeight = data.currentWeight;
  if (data.currentBodyFat !== undefined) userData.currentBodyFat = data.currentBodyFat;
  if (data.height !== undefined) userData.height = data.height;

  await setDoc(doc(db, "users", sakuraId), userData);
  return sakuraId;
}

export async function toggleDummyUserVisibility(id: string, isHidden: boolean): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");
  await updateDoc(doc(db, "users", id), {
    isHidden: !isHidden,
    updatedAt: Date.now() / 1000,
  });
}

export async function updateDummyUser(id: string, data: UpdateDummyUserData): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const updateData: Record<string, unknown> = {
    updatedAt: Date.now() / 1000,
  };

  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.gender !== undefined) updateData.gender = data.gender;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.trainingExperience !== undefined) updateData.trainingExperience = data.trainingExperience;
  if (data.currentWeight !== undefined) updateData.currentWeight = data.currentWeight;
  if (data.currentBodyFat !== undefined) updateData.currentBodyFat = data.currentBodyFat;
  if (data.height !== undefined) updateData.height = data.height;

  await updateDoc(doc(db, "users", id), updateData);
}

export async function deleteDummyUser(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");
  await deleteDoc(doc(db, "users", id));
}

// ========== コミュニティ投稿 ==========

export async function getDummyUserPosts(userId: string): Promise<DummyPost[]> {
  if (!db) throw new Error("Firestore is not initialized");

  const q = query(
    collection(db, "posts"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  const posts = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName || "",
      userMyTrainingIconURL: data.userMyTrainingIconURL,
      genre: data.genre || "その他",
      content: data.content || "",
      imageURL: data.imageURL,
      createdAt: typeof data.createdAt === "number"
        ? data.createdAt
        : data.createdAt instanceof Timestamp
          ? data.createdAt.seconds
          : Date.now() / 1000,
      likes: data.likes || [],
    };
  });

  posts.sort((a, b) => b.createdAt - a.createdAt);
  return posts;
}

async function uploadPostImage(postId: string, file: File): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized");

  const storageRef = ref(storage, `posts/${postId}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createDummyPost(data: CreateDummyPostData): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  // ユーザー情報取得
  const userDoc = await getDoc(doc(db, "users", data.userId));
  if (!userDoc.exists()) throw new Error("ユーザーが見つかりません");
  const userData = userDoc.data();

  const postId = crypto.randomUUID();
  const now = Date.now() / 1000;

  let imageURL: string | undefined;
  if (data.imageFile) {
    imageURL = await uploadPostImage(postId, data.imageFile);
  }

  const postData: Record<string, unknown> = {
    id: postId,
    userId: data.userId,
    userName: userData.displayName || "",
    userMyTrainingIconURL: userData.myTrainingIconURL || "",
    genre: data.genre,
    content: data.content,
    createdAt: now,
    likes: [],
  };

  if (imageURL) postData.imageURL = imageURL;

  await setDoc(doc(db, "posts", postId), postData);
  return postId;
}

// ========== 最新の筋肉 ==========

export async function getDummyUserMuscles(userId: string): Promise<DummyMuscle[]> {
  if (!db) throw new Error("Firestore is not initialized");

  const q = query(
    collection(db, "latest_muscles"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);

  const muscles = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName || "",
      muscleGroup: data.muscleGroup || "chest",
      imageUrl: data.imageUrl || "",
      uploadedAt: data.uploadedAt instanceof Timestamp
        ? data.uploadedAt.toDate()
        : new Date(),
      likes: data.likes || 0,
      likedByUsers: data.likedByUsers || [],
      viewCount: data.viewCount || 0,
    };
  });

  muscles.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  return muscles;
}

async function uploadMuscleImage(muscleId: string, file: File): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized");

  const storageRef = ref(storage, `latest_muscles/${muscleId}.jpg`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function createDummyMuscle(data: CreateDummyMuscleData): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  // ユーザー情報取得
  const userDoc = await getDoc(doc(db, "users", data.userId));
  if (!userDoc.exists()) throw new Error("ユーザーが見つかりません");
  const userData = userDoc.data();

  const muscleId = crypto.randomUUID();
  const imageUrl = await uploadMuscleImage(muscleId, data.imageFile);

  const muscleData = {
    id: muscleId,
    userId: data.userId,
    userName: userData.displayName || "",
    userProfileImageUrl: userData.profileImageURL || "",
    muscleGroup: data.muscleGroup,
    imageUrl,
    uploadedAt: Timestamp.now(),
    likes: 0,
    likedByUsers: [],
    viewCount: 0,
    weeklyLikes: 0,
    monthlyLikes: 0,
  };

  // latest_muscles と latest_muscle_posts 両方に書き込み
  await Promise.all([
    setDoc(doc(db, "latest_muscles", muscleId), muscleData),
    setDoc(doc(db, "latest_muscle_posts", muscleId), muscleData),
  ]);

  return muscleId;
}

// ========== バルクアクション ==========

// コミュニティ投稿にいいね
export async function bulkLikePost(
  postId: string,
  sakuraUserIds: string[]
): Promise<{ success: number; errors: string[] }> {
  if (!db) throw new Error("Firestore is not initialized");

  let success = 0;
  const errors: string[] = [];

  for (const userId of sakuraUserIds) {
    try {
      await updateDoc(doc(db, "posts", postId), {
        likes: arrayUnion(userId),
      });
      success++;
    } catch (e) {
      errors.push(`${userId}: ${e instanceof Error ? e.message : "不明なエラー"}`);
    }
  }

  return { success, errors };
}

// 最新の筋肉にいいね
export async function bulkLikeMuscle(
  muscleId: string,
  sakuraUserIds: string[]
): Promise<{ success: number; errors: string[] }> {
  if (!db) throw new Error("Firestore is not initialized");

  let success = 0;
  const errors: string[] = [];

  for (const userId of sakuraUserIds) {
    try {
      // latest_muscles と latest_muscle_posts 両方を更新
      await Promise.all([
        updateDoc(doc(db, "latest_muscles", muscleId), {
          likes: increment(1),
          likedByUsers: arrayUnion(userId),
        }),
        updateDoc(doc(db, "latest_muscle_posts", muscleId), {
          likes: increment(1),
          likedByUsers: arrayUnion(userId),
        }),
      ]);
      success++;
    } catch (e) {
      errors.push(`${userId}: ${e instanceof Error ? e.message : "不明なエラー"}`);
    }
  }

  return { success, errors };
}

// 閲覧数追加
export async function bulkAddViews(
  muscleId: string,
  count: number
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  await Promise.all([
    updateDoc(doc(db, "latest_muscles", muscleId), {
      viewCount: increment(count),
    }),
    updateDoc(doc(db, "latest_muscle_posts", muscleId), {
      viewCount: increment(count),
    }),
  ]);
}

// ========== マイトレ（UserTraining）CRUD ==========

export async function getUserTrainings(userId: string): Promise<UserTraining[]> {
  if (!db) throw new Error("Firestore is not initialized");

  const snapshot = await getDocs(
    collection(db, "users", userId, "trainings")
  );

  const trainings = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId: data.userId || userId,
      muscleGroup: data.muscleGroup || "chest",
      exercises: (data.exercises || []) as TrainingExercise[],
      lastUpdated: typeof data.lastUpdated === "number"
        ? data.lastUpdated
        : data.lastUpdated instanceof Timestamp
          ? data.lastUpdated.seconds
          : Date.now() / 1000,
      customMuscleNames: data.customMuscleNames,
      customMusclePositionX: data.customMusclePositionX,
      customMusclePositionY: data.customMusclePositionY,
      customImagePath: data.customImagePath,
      customImageSizeWidth: data.customImageSizeWidth ?? 120,
      customImageSizeHeight: data.customImageSizeHeight ?? 120,
      customImagePositionX: data.customImagePositionX,
      customImagePositionY: data.customImagePositionY,
      showConnectingLine: data.showConnectingLine ?? true,
      trainingMenu: data.trainingMenu,
      trainingMediaURLs: data.trainingMediaURLs,
      trainingDetails: data.trainingDetails,
    } as UserTraining;
  });

  trainings.sort((a, b) => b.lastUpdated - a.lastUpdated);
  return trainings;
}

export async function createUserTraining(data: CreateUserTrainingData): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized");

  const trainingId = crypto.randomUUID();
  const now = Date.now() / 1000;

  let customImagePath: string | undefined;
  if (data.customImageFile) {
    if (!storage) throw new Error("Firebase Storage is not initialized");
    const storageRef = ref(
      storage,
      `training_images/${data.userId}/${data.muscleGroup}_${trainingId}.jpg`
    );
    await uploadBytes(storageRef, data.customImageFile);
    customImagePath = await getDownloadURL(storageRef);
  }

  // デフォルトのホットスポット位置（iOS EditMuscleHotspotView.swift 準拠）
  const defaultPositions: Record<string, { x: number; y: number }> = {
    chest: { x: 175, y: 140 },
    arms: { x: 115, y: 160 },
    shoulders: { x: 175, y: 120 },
    back: { x: 235, y: 160 },
    abs: { x: 175, y: 180 },
    legs: { x: 175, y: 280 },
    glutes: { x: 175, y: 240 },
  };
  const defaultPos = defaultPositions[data.muscleGroup] || { x: 175, y: 175 };
  const pos = {
    x: data.customMusclePositionX ?? defaultPos.x,
    y: data.customMusclePositionY ?? defaultPos.y,
  };

  const trainingDoc: Record<string, unknown> = {
    id: trainingId,
    userId: data.userId,
    muscleGroup: data.muscleGroup,
    exercises: data.exercises.map((ex) => ({
      id: ex.id || crypto.randomUUID(),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight || null,
      notes: ex.notes || null,
      restTime: ex.restTime || null,
    })),
    lastUpdated: now,
    showConnectingLine: true,
    customImageSizeWidth: 120,
    customImageSizeHeight: 120,
    customMusclePositionX: pos.x,
    customMusclePositionY: pos.y,
  };

  if (data.customImagePositionX !== undefined) trainingDoc.customImagePositionX = data.customImagePositionX;
  if (data.customImagePositionY !== undefined) trainingDoc.customImagePositionY = data.customImagePositionY;
  if (data.customMuscleNames?.length) trainingDoc.customMuscleNames = data.customMuscleNames;
  if (customImagePath) trainingDoc.customImagePath = customImagePath;
  if (data.trainingMenu) trainingDoc.trainingMenu = data.trainingMenu;
  if (data.trainingDetails) trainingDoc.trainingDetails = data.trainingDetails;

  // users/{userId}/trainings/{trainingId} に保存
  await setDoc(
    doc(db, "users", data.userId, "trainings", trainingId),
    trainingDoc
  );

  // latest_muscles にも投稿（画像がある場合）
  if (customImagePath) {
    const userDocSnap = await getDoc(doc(db, "users", data.userId));
    const userData = userDocSnap.exists() ? userDocSnap.data() : {};

    const muscleData = {
      id: trainingId,
      userId: data.userId,
      userName: userData.displayName || "",
      userProfileImageUrl: userData.profileImageURL || "",
      muscleGroup: data.muscleGroup,
      imageUrl: customImagePath,
      uploadedAt: Timestamp.now(),
      likes: 0,
      likedByUsers: [],
      viewCount: 0,
      weeklyLikes: 0,
      monthlyLikes: 0,
      userTraining: trainingDoc,
    };

    await Promise.all([
      setDoc(doc(db, "latest_muscles", trainingId), muscleData),
      setDoc(doc(db, "latest_muscle_posts", trainingId), muscleData),
    ]);
  }

  return trainingId;
}

export async function updateUserTraining(data: UpdateUserTrainingData): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const now = Date.now() / 1000;
  const updateData: Record<string, unknown> = { lastUpdated: now };

  // 新しい画像アップロード
  if (data.customImageFile) {
    if (!storage) throw new Error("Firebase Storage is not initialized");
    const group = data.muscleGroup || "custom";
    const storageRef = ref(
      storage,
      `training_images/${data.userId}/${group}_${data.trainingId}.jpg`
    );
    await uploadBytes(storageRef, data.customImageFile);
    updateData.customImagePath = await getDownloadURL(storageRef);
  }

  if (data.muscleGroup !== undefined) updateData.muscleGroup = data.muscleGroup;
  if (data.exercises !== undefined) {
    updateData.exercises = data.exercises.map((ex) => ({
      id: ex.id || crypto.randomUUID(),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight || null,
      notes: ex.notes || null,
      restTime: ex.restTime || null,
    }));
  }
  if (data.customMuscleNames !== undefined) {
    updateData.customMuscleNames = data.customMuscleNames || [];
  }
  if (data.trainingMenu !== undefined) {
    updateData.trainingMenu = data.trainingMenu || "";
  }
  if (data.trainingDetails !== undefined) {
    updateData.trainingDetails = data.trainingDetails || "";
  }
  if (data.customMusclePositionX !== undefined) updateData.customMusclePositionX = data.customMusclePositionX;
  if (data.customMusclePositionY !== undefined) updateData.customMusclePositionY = data.customMusclePositionY;
  if (data.customImagePositionX !== undefined) updateData.customImagePositionX = data.customImagePositionX;
  if (data.customImagePositionY !== undefined) updateData.customImagePositionY = data.customImagePositionY;

  await updateDoc(
    doc(db, "users", data.userId, "trainings", data.trainingId),
    updateData
  );
}

export async function deleteUserTraining(userId: string, trainingId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");
  await deleteDoc(doc(db, "users", userId, "trainings", trainingId));
}

// リアルユーザーからランダム取得（サクラ以外）
export async function getRandomRealUserIds(count: number): Promise<string[]> {
  if (!db) throw new Error("Firestore is not initialized");

  const q = query(
    collection(db, "users"),
    where("isSakura", "!=", true)
  );
  const snapshot = await getDocs(q);
  const allIds = snapshot.docs.map((doc) => doc.id);

  // Fisher-Yates shuffle & pick
  const shuffled = [...allIds];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// バルクアクション実行
export async function executeBulkAction(
  config: BulkActionConfig
): Promise<{ success: number; errors: string[] }> {
  switch (config.actionType) {
    case "like_post":
      return bulkLikePost(config.targetId, config.sakuraUserIds);
    case "like_muscle":
      return bulkLikeMuscle(config.targetId, config.sakuraUserIds);
    case "add_view":
      await bulkAddViews(config.targetId, config.sakuraUserIds.length);
      return { success: config.sakuraUserIds.length, errors: [] };
    default:
      throw new Error("不明なアクションタイプ");
  }
}
