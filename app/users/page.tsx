"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where, Timestamp, deleteDoc, doc, updateDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";

type UserRole = "viewer" | "trainer" | "admin";
type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
type Gender = "male" | "female" | "other";
type FitnessGoal = "diet" | "bodyTransformation" | "other";

interface TrainingProfile {
  trainingExperience?: number;
  currentWeight?: number;
  currentBodyFat?: number;
  height?: number;
  targetWeight?: number;
  targetBodyFat?: number;
  bio?: string;
  fitnessGoal?: FitnessGoal;
}

interface UserStats {
  rankingScore: number;
  bestRank?: number;
  currentRank?: number;
  totalVotesReceived: number;
  wonCompetitionsCount: number;
  followerCount: number;
  followingCount: number;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  helpfulAnswersCount: number;
  totalTrainingDays: number;
  consecutiveTrainingDays: number;
  longestStreak: number;
  lastTrainingDate?: Date;
  photosCount: number;
  trainingsCount: number;
  postsCount: number;
  servicesOffered: number;
}

interface PointsData {
  balance: number;
  earnedTotal: number;
  spentTotal: number;
  lastUpdated?: Date;
}

interface TrainerData {
  isActive: boolean;
  contactUrl?: string;
  qualifications: string[];
  experience: number;
  specialties: string[];
  rating: number;
  reviewCount: number;
  totalEarnings: number;
  completedOrders: number;
}

interface PrivacySettings {
  showWeight: boolean;
  showBodyFat: boolean;
  showHeight: boolean;
  showBodyProgress: boolean;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  gender?: Gender;
  role: UserRole;
  verificationStatus: VerificationStatus;
  profileImageURL?: string;
  profileThumbnailURL?: string;
  myTrainingIconURL?: string;
  profile?: TrainingProfile;
  privacy?: PrivacySettings;
  stats?: UserStats;
  points?: PointsData;
  trainer?: TrainerData;
  createdAt: Date;
  updatedAt?: Date;
  favoriteTrainerIds: string[];
  followingIds: string[];
  participatedCompetitionIds: string[];
  wonCompetitionIds: string[];
  achievementIds: string[];
  badgeIds: string[];
  featuredAchievementIds: string[];
  activeTitleId?: string;
  isSubscribed: boolean;
  hasFemaleTrainerAccess: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    role: "viewer" as UserRole,
    verificationStatus: "unverified" as VerificationStatus,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"), limit(100));
      const querySnapshot = await getDocs(q);

      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedUsers.push({
          id: doc.id,
          email: data.email || "",
          displayName: data.displayName || "名前未設定",
          gender: data.gender,
          role: data.role || "viewer",
          verificationStatus: data.verificationStatus || "unverified",
          profileImageURL: data.profileImageURL,
          profileThumbnailURL: data.profileThumbnailURL,
          myTrainingIconURL: data.myTrainingIconURL,
          profile: data.profile,
          privacy: data.privacy,
          stats: data.stats,
          points: data.points,
          trainer: data.trainer,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : typeof data.createdAt === "number"
              ? new Date(data.createdAt * 1000)
              : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : typeof data.updatedAt === "number"
              ? new Date(data.updatedAt * 1000)
              : undefined,
          favoriteTrainerIds: data.favoriteTrainerIds || [],
          followingIds: data.followingIds || [],
          participatedCompetitionIds: data.participatedCompetitionIds || [],
          wonCompetitionIds: data.wonCompetitionIds || [],
          achievementIds: data.achievementIds || [],
          badgeIds: data.badgeIds || [],
          featuredAchievementIds: data.featuredAchievementIds || [],
          activeTitleId: data.activeTitleId,
          isSubscribed: data.isSubscribed || false,
          hasFemaleTrainerAccess: data.hasFemaleTrainerAccess || false,
        });
      });

      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.verificationStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSearch = () => {
    // Search is already reactive through filteredUsers
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "trainer": return "トレーナー";
      case "admin": return "管理者";
      default: return "一般";
    }
  };

  const getStatusLabel = (status: VerificationStatus) => {
    switch (status) {
      case "verified": return "認証済み";
      case "pending": return "認証待ち";
      case "rejected": return "却下";
      default: return "未認証";
    }
  };

  const getGenderLabel = (gender?: Gender) => {
    switch (gender) {
      case "male": return "男性";
      case "female": return "女性";
      case "other": return "その他";
      default: return "未設定";
    }
  };

  const getFitnessGoalLabel = (goal?: FitnessGoal) => {
    switch (goal) {
      case "diet": return "ダイエット";
      case "bodyTransformation": return "肉体改造";
      case "other": return "その他";
      default: return "未設定";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenDetail = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      displayName: user.displayName,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
    setIsEditing(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        displayName: editFormData.displayName,
        role: editFormData.role,
        verificationStatus: editFormData.verificationStatus,
      });
      alert("ユーザー情報を更新しました");
      setIsEditing(false);
      fetchUsers();
      // 選択中のユーザー情報も更新
      setSelectedUser({
        ...selectedUser,
        displayName: editFormData.displayName,
        role: editFormData.role,
        verificationStatus: editFormData.verificationStatus,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      alert("更新に失敗しました");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (!confirm(`${selectedUser.displayName} を削除しますか？この操作は取り消せません。`)) return;

    try {
      await deleteDoc(doc(db, "users", selectedUser.id));
      alert("ユーザーを削除しました");
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("削除に失敗しました");
    }
  };

  return (
    <ProtectedLayout>
    <div className="min-h-screen bg-gray-50">
      <Header title="ユーザー管理" />

      <main className="p-8">
        {/* 検索・フィルタ */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="ユーザー名・メールで検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全ての権限</option>
              <option value="viewer">一般ユーザー</option>
              <option value="trainer">トレーナー</option>
              <option value="admin">管理者</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全てのステータス</option>
              <option value="verified">認証済み</option>
              <option value="pending">認証待ち</option>
              <option value="unverified">未認証</option>
              <option value="rejected">却下</option>
            </select>
            <button
              onClick={handleSearch}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              検索
            </button>
          </div>
        </div>

        {/* ユーザー一覧 */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ユーザー情報
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      権限
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "trainer" ? "bg-purple-100 text-purple-800" :
                          user.role === "admin" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.verificationStatus === "verified" ? "bg-green-100 text-green-800" :
                          user.verificationStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                          user.verificationStatus === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {getStatusLabel(user.verificationStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleOpenDetail(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 結果表示 */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                表示中: {filteredUsers.length}件 / 全{users.length}件
              </div>
            </div>
          </>
        )}

        {/* 詳細モーダル */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isEditing ? "ユーザー編集" : "ユーザー詳細"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {isEditing ? (
                  // 編集フォーム
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                      <input
                        type="text"
                        value={editFormData.displayName}
                        onChange={(e) => setEditFormData({ ...editFormData, displayName: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
                      <select
                        value={editFormData.role}
                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="viewer">一般ユーザー</option>
                        <option value="trainer">トレーナー</option>
                        <option value="admin">管理者</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">認証ステータス</label>
                      <select
                        value={editFormData.verificationStatus}
                        onChange={(e) => setEditFormData({ ...editFormData, verificationStatus: e.target.value as VerificationStatus })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="unverified">未認証</option>
                        <option value="pending">認証待ち</option>
                        <option value="verified">認証済み</option>
                        <option value="rejected">却下</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleUpdateUser}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 詳細表示
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* 基本情報 */}
                    <div className="flex items-center space-x-4">
                      {selectedUser.profileImageURL || selectedUser.profileThumbnailURL ? (
                        <img
                          src={selectedUser.profileThumbnailURL || selectedUser.profileImageURL}
                          alt={selectedUser.displayName}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-2xl text-gray-500">
                            {selectedUser.displayName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedUser.displayName}</h3>
                        <p className="text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>

                    {/* 基本情報セクション */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">基本情報</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">ユーザーID</div>
                          <div className="font-mono text-xs text-gray-900 break-all">{selectedUser.id}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">性別</div>
                          <div className="font-semibold text-gray-900">{getGenderLabel(selectedUser.gender)}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">権限</div>
                          <div className="font-semibold text-gray-900">{getRoleLabel(selectedUser.role)}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">認証ステータス</div>
                          <div className="font-semibold text-gray-900">{getStatusLabel(selectedUser.verificationStatus)}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">登録日時</div>
                          <div className="font-semibold text-gray-900">{formatDateTime(selectedUser.createdAt)}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">更新日時</div>
                          <div className="font-semibold text-gray-900">{selectedUser.updatedAt ? formatDateTime(selectedUser.updatedAt) : "-"}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">サブスク</div>
                          <div className="font-semibold text-gray-900">{selectedUser.isSubscribed ? "加入中" : "未加入"}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">女性トレーナーアクセス</div>
                          <div className="font-semibold text-gray-900">{selectedUser.hasFemaleTrainerAccess ? "あり" : "なし"}</div>
                        </div>
                      </div>
                    </div>

                    {/* 筋トレプロフィール */}
                    {selectedUser.profile && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">筋トレプロフィール</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">筋トレ歴</div>
                            <div className="font-semibold text-gray-900">{selectedUser.profile.trainingExperience ? `${selectedUser.profile.trainingExperience}ヶ月` : "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">身長</div>
                            <div className="font-semibold text-gray-900">{selectedUser.profile.height ? `${selectedUser.profile.height}cm` : "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">体重</div>
                            <div className="font-semibold text-gray-900">{selectedUser.profile.currentWeight ? `${selectedUser.profile.currentWeight}kg` : "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">体脂肪率</div>
                            <div className="font-semibold text-gray-900">{selectedUser.profile.currentBodyFat ? `${selectedUser.profile.currentBodyFat}%` : "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">目標体重</div>
                            <div className="font-semibold text-gray-900">{selectedUser.profile.targetWeight ? `${selectedUser.profile.targetWeight}kg` : "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">目標体脂肪率</div>
                            <div className="font-semibold text-gray-900">{selectedUser.profile.targetBodyFat ? `${selectedUser.profile.targetBodyFat}%` : "-"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                            <div className="text-xs text-gray-500">フィットネス目標</div>
                            <div className="font-semibold text-gray-900">{getFitnessGoalLabel(selectedUser.profile.fitnessGoal)}</div>
                          </div>
                          {selectedUser.profile.bio && (
                            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                              <div className="text-xs text-gray-500">自己紹介</div>
                              <div className="text-gray-900">{selectedUser.profile.bio}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 統計情報 */}
                    {selectedUser.stats && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">統計情報</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">フォロワー</div>
                            <div className="font-bold text-blue-600">{selectedUser.stats.followerCount}</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">フォロー中</div>
                            <div className="font-bold text-blue-600">{selectedUser.stats.followingCount}</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">いいね獲得</div>
                            <div className="font-bold text-red-600">{selectedUser.stats.totalLikesReceived}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">トレーニング日数</div>
                            <div className="font-bold text-green-600">{selectedUser.stats.totalTrainingDays}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">連続日数</div>
                            <div className="font-bold text-green-600">{selectedUser.stats.consecutiveTrainingDays}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">最長連続</div>
                            <div className="font-bold text-green-600">{selectedUser.stats.longestStreak}</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">投稿数</div>
                            <div className="font-bold text-purple-600">{selectedUser.stats.postsCount}</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">写真数</div>
                            <div className="font-bold text-purple-600">{selectedUser.stats.photosCount}</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">トレーニング数</div>
                            <div className="font-bold text-purple-600">{selectedUser.stats.trainingsCount}</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">ランキングスコア</div>
                            <div className="font-bold text-yellow-600">{selectedUser.stats.rankingScore.toFixed(1)}</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">現在ランク</div>
                            <div className="font-bold text-yellow-600">{selectedUser.stats.currentRank ?? "-"}</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">最高ランク</div>
                            <div className="font-bold text-yellow-600">{selectedUser.stats.bestRank ?? "-"}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ポイント情報 */}
                    {selectedUser.points && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">ポイント情報</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">残高</div>
                            <div className="font-bold text-orange-600">{selectedUser.points.balance.toLocaleString()}</div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">総獲得</div>
                            <div className="font-bold text-orange-600">{selectedUser.points.earnedTotal.toLocaleString()}</div>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg text-center">
                            <div className="text-xs text-gray-500">総使用</div>
                            <div className="font-bold text-orange-600">{selectedUser.points.spentTotal.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* トレーナー情報 */}
                    {selectedUser.trainer && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">トレーナー情報</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">ステータス</div>
                            <div className="font-semibold text-gray-900">{selectedUser.trainer.isActive ? "アクティブ" : "非アクティブ"}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">経験年数</div>
                            <div className="font-semibold text-gray-900">{selectedUser.trainer.experience}年</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">評価</div>
                            <div className="font-semibold text-gray-900">⭐ {selectedUser.trainer.rating.toFixed(1)} ({selectedUser.trainer.reviewCount}件)</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">完了注文数</div>
                            <div className="font-semibold text-gray-900">{selectedUser.trainer.completedOrders}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">総収益</div>
                            <div className="font-semibold text-gray-900">¥{selectedUser.trainer.totalEarnings.toLocaleString()}</div>
                          </div>
                          {selectedUser.trainer.contactUrl && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-xs text-gray-500">連絡先URL</div>
                              <div className="font-semibold text-gray-900 truncate">{selectedUser.trainer.contactUrl}</div>
                            </div>
                          )}
                          {selectedUser.trainer.specialties?.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                              <div className="text-xs text-gray-500">専門分野</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedUser.trainer.specialties.map((s, i) => (
                                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedUser.trainer.qualifications?.length > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                              <div className="text-xs text-gray-500">資格</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedUser.trainer.qualifications.map((q, i) => (
                                  <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">{q}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 配列データ */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3 border-b pb-2">その他データ</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">お気に入りトレーナー</div>
                          <div className="font-semibold text-gray-900">{selectedUser.favoriteTrainerIds?.length ?? 0}人</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">フォロー中</div>
                          <div className="font-semibold text-gray-900">{selectedUser.followingIds?.length ?? 0}人</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">参加大会</div>
                          <div className="font-semibold text-gray-900">{selectedUser.participatedCompetitionIds?.length ?? 0}回</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">優勝大会</div>
                          <div className="font-semibold text-gray-900">{selectedUser.wonCompetitionIds?.length ?? 0}回</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">実績</div>
                          <div className="font-semibold text-gray-900">{selectedUser.achievementIds?.length ?? 0}個</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500">バッジ</div>
                          <div className="font-semibold text-gray-900">{selectedUser.badgeIds?.length ?? 0}個</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        編集
                      </button>
                      <button
                        onClick={handleDeleteUser}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </ProtectedLayout>
  );
}
