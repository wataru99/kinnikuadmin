// ダミーユーザー（サクラ）関連の型定義

export type Gender = "male" | "female" | "other";

export interface DummyUser {
  id: string;
  email: string;
  displayName: string;
  gender: Gender;
  role: "viewer";
  verificationStatus: "unverified";
  isSubscribed: false;
  hasFemaleTrainerAccess: false;
  isSakura: true;
  isHidden?: boolean; // アプリ上で非表示にするフラグ
  bio?: string;
  trainingExperience?: number;
  currentWeight?: number;
  currentBodyFat?: number;
  height?: number;
  profileImageURL?: string;
  myTrainingIconURL?: string;
  createdAt: number; // epoch秒 (iOS: Date().timeIntervalSince1970)
  updatedAt: number;
}

export interface CreateDummyUserData {
  displayName: string;
  gender: Gender;
  bio?: string;
  trainingExperience?: number;
  currentWeight?: number;
  currentBodyFat?: number;
  height?: number;
}

export interface UpdateDummyUserData {
  displayName?: string;
  gender?: Gender;
  bio?: string;
  trainingExperience?: number;
  currentWeight?: number;
  currentBodyFat?: number;
  height?: number;
}

// コミュニティ投稿（posts コレクション）
export type PostGenre = "悩み相談" | "独り言" | "アドバイス" | "進捗報告" | "その他";

export interface DummyPost {
  id: string;
  userId: string;
  userName: string;
  userMyTrainingIconURL?: string;
  genre: PostGenre;
  content: string;
  imageURL?: string;
  createdAt: number; // epoch秒
  likes: string[];
}

export interface CreateDummyPostData {
  userId: string;
  genre: PostGenre;
  content: string;
  imageFile?: File;
}

// 最新の筋肉（latest_muscles / latest_muscle_posts コレクション）
export type MuscleGroup = "chest" | "back" | "shoulders" | "arms" | "legs" | "abs" | "glutes";

export interface DummyMuscle {
  id: string;
  userId: string;
  userName: string;
  muscleGroup: MuscleGroup;
  imageUrl: string;
  uploadedAt: Date; // Firestore Timestamp
  likes: number;
  likedByUsers: string[];
  viewCount: number;
}

export interface CreateDummyMuscleData {
  userId: string;
  muscleGroup: MuscleGroup;
  imageFile: File;
}

// バルクアクション
export type BulkActionType = "like_post" | "like_muscle" | "add_view";

export interface BulkActionConfig {
  actionType: BulkActionType;
  sakuraUserIds: string[];
  targetId: string;
}

export interface ActionLog {
  timestamp: Date;
  action: string;
  result: "success" | "error";
  detail: string;
}

// ========== マイトレ（UserTraining） ==========

export interface TrainingExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
  restTime?: number; // 秒
}

export interface UserTraining {
  id: string;
  userId: string;
  muscleGroup: MuscleGroup;
  exercises: TrainingExercise[];
  lastUpdated: number; // epoch秒
  customMuscleNames?: string[];
  customMusclePositionX?: number;
  customMusclePositionY?: number;
  customImagePath?: string;
  customImageSizeWidth: number;
  customImageSizeHeight: number;
  customImagePositionX?: number;
  customImagePositionY?: number;
  showConnectingLine: boolean;
  trainingMenu?: string;
  trainingMediaURLs?: string[];
  trainingDetails?: string;
}

export interface CreateUserTrainingData {
  userId: string;
  muscleGroup: MuscleGroup;
  exercises: TrainingExercise[];
  customMuscleNames?: string[];
  customImageFile?: File;
  trainingMenu?: string;
  trainingDetails?: string;
  customMusclePositionX?: number;
  customMusclePositionY?: number;
  customImagePositionX?: number;
  customImagePositionY?: number;
}

export interface UpdateUserTrainingData {
  userId: string;
  trainingId: string;
  muscleGroup?: MuscleGroup;
  exercises?: TrainingExercise[];
  customMuscleNames?: string[] | null;
  customImageFile?: File;
  trainingMenu?: string | null;
  trainingDetails?: string | null;
  customMusclePositionX?: number;
  customMusclePositionY?: number;
  customImagePositionX?: number;
  customImagePositionY?: number;
}

// ラベルマッピング
export const genderLabels: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

export const postGenreOptions: PostGenre[] = [
  "悩み相談",
  "独り言",
  "アドバイス",
  "進捗報告",
  "その他",
];

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: "胸",
  back: "背中",
  shoulders: "肩",
  arms: "腕",
  legs: "脚",
  abs: "腹筋",
  glutes: "お尻",
};
