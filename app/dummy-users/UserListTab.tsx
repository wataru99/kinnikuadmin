"use client";

import { useState } from "react";
import {
  DummyUser,
  CreateDummyUserData,
  Gender,
  genderLabels,
} from "@/lib/types/dummyUser";
import {
  createDummyUser,
  updateDummyUser,
  deleteDummyUser,
  toggleDummyUserVisibility,
} from "@/lib/services/dummyUserService";

interface Props {
  users: DummyUser[];
  loading: boolean;
  onRefresh: () => void;
}

const emptyForm: CreateDummyUserData = {
  displayName: "",
  gender: "male",
  bio: "",
  trainingExperience: undefined,
  currentWeight: undefined,
  currentBodyFat: undefined,
  height: undefined,
};

export default function UserListTab({ users, loading, onRefresh }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DummyUser | null>(null);
  const [formData, setFormData] = useState<CreateDummyUserData>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("");

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = !genderFilter || u.gender === genderFilter;
    return matchesSearch && matchesGender;
  });

  const maleCount = users.filter((u) => u.gender === "male").length;
  const femaleCount = users.filter((u) => u.gender === "female").length;
  const otherCount = users.filter((u) => u.gender === "other").length;
  const visibleCount = users.filter((u) => !u.isHidden).length;
  const hiddenCount = users.filter((u) => u.isHidden === true).length;

  const handleCreate = async () => {
    if (!formData.displayName.trim()) return;
    setSaving(true);
    try {
      await createDummyUser(formData);
      setShowCreateModal(false);
      setFormData({ ...emptyForm });
      onRefresh();
    } catch (e) {
      alert(`作成に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: DummyUser) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      gender: user.gender,
      bio: user.bio || "",
      trainingExperience: user.trainingExperience,
      currentWeight: user.currentWeight,
      currentBodyFat: user.currentBodyFat,
      height: user.height,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateDummyUser(selectedUser.id, formData);
      setShowEditModal(false);
      setSelectedUser(null);
      onRefresh();
    } catch (e) {
      alert(`更新に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (user: DummyUser) => {
    try {
      await toggleDummyUserVisibility(user.id, user.isHidden === true);
      onRefresh();
    } catch (e) {
      alert(`切り替えに失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    }
  };

  const handleDelete = async (user: DummyUser) => {
    if (!confirm(`「${user.displayName}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      await deleteDummyUser(user.id);
      onRefresh();
    } catch (e) {
      alert(`削除に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    }
  };

  const formatDate = (epoch: number) => {
    return new Date(epoch * 1000).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (epoch: number) => {
    return new Date(epoch * 1000).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    });
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">表示名 *</label>
        <input
          type="text"
          value={formData.displayName}
          onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
          placeholder="例: マッチョ太郎"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
        >
          {(Object.entries(genderLabels) as [Gender, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
        <textarea
          value={formData.bio || ""}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
          rows={3}
          placeholder="自己紹介文を入力"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">筋トレ歴（月）</label>
          <input
            type="number"
            value={formData.trainingExperience ?? ""}
            onChange={(e) => setFormData({ ...formData, trainingExperience: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="24"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">身長 (cm)</label>
          <input
            type="number"
            step="0.1"
            value={formData.height ?? ""}
            onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="175"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={formData.currentWeight ?? ""}
            onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="70"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">体脂肪 (%)</label>
          <input
            type="number"
            step="0.1"
            value={formData.currentBodyFat ?? ""}
            onChange={(e) => setFormData({ ...formData, currentBodyFat: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="15"
          />
        </div>
      </div>
    </div>
  );

  const renderModal = (
    title: string,
    onSubmit: () => void,
    onClose: () => void,
    submitLabel: string,
    submittingLabel: string,
    extra?: React.ReactNode
  ) => (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {extra}
          {renderForm()}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onSubmit}
              disabled={saving || !formData.displayName.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? submittingLabel : submitLabel}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* 統計カード */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="text-xs lg:text-sm text-gray-600">合計</div>
          <div className="text-xl lg:text-2xl font-bold text-gray-900">{users.length}人</div>
        </div>
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="text-xs lg:text-sm text-gray-600">表示中</div>
          <div className="text-xl lg:text-2xl font-bold text-green-600">{visibleCount}人</div>
        </div>
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="text-xs lg:text-sm text-gray-600">非表示</div>
          <div className="text-xl lg:text-2xl font-bold text-red-600">{hiddenCount}人</div>
        </div>
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="text-xs lg:text-sm text-gray-600">男性</div>
          <div className="text-xl lg:text-2xl font-bold text-blue-600">{maleCount}人</div>
        </div>
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="text-xs lg:text-sm text-gray-600">女性</div>
          <div className="text-xl lg:text-2xl font-bold text-pink-600">{femaleCount}人</div>
        </div>
        <div className="bg-white p-3 lg:p-4 rounded-lg shadow">
          <div className="text-xs lg:text-sm text-gray-600">その他</div>
          <div className="text-xl lg:text-2xl font-bold text-gray-600">{otherCount}人</div>
        </div>
      </div>

      {/* 検索・フィルタ・追加ボタン */}
      <div className="bg-white shadow rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="名前で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全性別</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
            </select>
          </div>
          <button
            onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}
            className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 font-medium"
          >
            + 新規作成
          </button>
        </div>
      </div>

      {/* ユーザー一覧 */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-12 text-center text-gray-500">読み込み中...</div>
      ) : (
        <>
          {/* モバイル: カードリスト */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className={`bg-white shadow rounded-lg p-4 ${user.isHidden ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{user.displayName}</span>
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                        user.gender === "male" ? "bg-blue-100 text-blue-800" :
                        user.gender === "female" ? "bg-pink-100 text-pink-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {genderLabels[user.gender]}
                      </span>
                      {user.isHidden && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          非表示
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{user.id}</div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatDateShort(user.createdAt)}
                  </div>
                </div>

                {/* プロフィール情報 */}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mb-3">
                  {user.trainingExperience && <span>歴{user.trainingExperience}ヶ月</span>}
                  {user.height && <span>{user.height}cm</span>}
                  {user.currentWeight && <span>{user.currentWeight}kg</span>}
                  {user.currentBodyFat && <span>{user.currentBodyFat}%</span>}
                </div>

                {/* アクションボタン */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleVisibility(user)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                      user.isHidden
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                  >
                    {user.isHidden ? "表示する" : "非表示にする"}
                  </button>
                  <button
                    onClick={() => handleEdit(user)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="px-3 py-2 text-red-600 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* デスクトップ: テーブル */}
          <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー情報</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">性別</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">表示状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">プロフィール</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作成日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${user.isHidden ? "opacity-50" : ""}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                      <div className="text-xs text-gray-500 font-mono">{user.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.gender === "male" ? "bg-blue-100 text-blue-800" :
                        user.gender === "female" ? "bg-pink-100 text-pink-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {genderLabels[user.gender]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleVisibility(user)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer transition-colors ${
                          user.isHidden
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200"
                        }`}
                      >
                        {user.isHidden ? "非表示" : "表示中"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {user.trainingExperience && <div>筋トレ歴: {user.trainingExperience}ヶ月</div>}
                        {user.height && <div>身長: {user.height}cm</div>}
                        {user.currentWeight && <div>体重: {user.currentWeight}kg</div>}
                        {user.currentBodyFat && <div>体脂肪: {user.currentBodyFat}%</div>}
                        {!user.trainingExperience && !user.height && !user.currentWeight && <div className="text-gray-400">未設定</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 mr-3">
                        編集
                      </button>
                      <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              {users.length === 0 ? "ダミーユーザーがいません" : "条件に一致するユーザーがいません"}
            </div>
          )}
        </>
      )}

      <div className="mt-3 text-xs lg:text-sm text-gray-600">
        表示中: {filteredUsers.length}件 / 全{users.length}件
      </div>

      {/* 作成モーダル */}
      {showCreateModal && renderModal(
        "ダミーユーザー新規作成",
        handleCreate,
        () => setShowCreateModal(false),
        "作成",
        "作成中..."
      )}

      {/* 編集モーダル */}
      {showEditModal && selectedUser && renderModal(
        "ダミーユーザー編集",
        handleUpdate,
        () => { setShowEditModal(false); setSelectedUser(null); },
        "保存",
        "保存中...",
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500">ID</div>
          <div className="font-mono text-sm text-gray-900 break-all">{selectedUser.id}</div>
        </div>
      )}
    </div>
  );
}
