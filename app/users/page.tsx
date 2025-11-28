"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

type UserRole = "viewer" | "trainer" | "admin";
type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  isTrainerActive?: boolean;
  followerCount?: number;
  totalLikesReceived?: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedUsers.push({
          id: doc.id,
          email: data.email || "",
          displayName: data.displayName || "名前未設定",
          role: data.role || "viewer",
          verificationStatus: data.verificationStatus || "unverified",
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
          isTrainerActive: data.isTrainerActive,
          followerCount: data.followerCount || 0,
          totalLikesReceived: data.totalLikesReceived || 0,
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="ユーザー管理" />

      <main className="p-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">総ユーザー数</div>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">認証済み</div>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.verificationStatus === "verified").length}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">トレーナー</div>
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === "trainer").length}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm font-medium text-gray-500 mb-1">認証待ち</div>
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.verificationStatus === "pending").length}
            </div>
          </div>
        </div>

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
                      統計
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      登録日
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
                        <div className="space-y-1">
                          <div>フォロワー: {user.followerCount || 0}</div>
                          <div>いいね: {user.totalLikesReceived || 0}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">詳細</button>
                        <button className="text-green-600 hover:text-green-900">編集</button>
                        <button className="text-red-600 hover:text-red-900">停止</button>
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
      </main>
    </div>
  );
}
