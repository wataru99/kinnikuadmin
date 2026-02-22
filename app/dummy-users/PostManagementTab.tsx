"use client";

import { useState, useEffect } from "react";
import {
  DummyUser,
  DummyPost,
  DummyMuscle,
  PostGenre,
  MuscleGroup,
  postGenreOptions,
  muscleGroupLabels,
} from "@/lib/types/dummyUser";
import {
  getDummyUserPosts,
  getDummyUserMuscles,
  createDummyPost,
  createDummyMuscle,
} from "@/lib/services/dummyUserService";

interface Props {
  users: DummyUser[];
}

type PostType = "community" | "muscle";

export default function PostManagementTab({ users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [postType, setPostType] = useState<PostType>("community");

  const [genre, setGenre] = useState<PostGenre>("その他");
  const [content, setContent] = useState("");
  const [postImageFile, setPostImageFile] = useState<File | null>(null);

  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("chest");
  const [muscleImageFile, setMuscleImageFile] = useState<File | null>(null);

  const [posts, setPosts] = useState<DummyPost[]>([]);
  const [muscles, setMuscles] = useState<DummyMuscle[]>([]);
  const [listType, setListType] = useState<PostType>("community");
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedUserId) {
      fetchList();
    } else {
      setPosts([]);
      setMuscles([]);
    }
  }, [selectedUserId, listType]);

  const fetchList = async () => {
    if (!selectedUserId) return;
    setLoadingList(true);
    try {
      if (listType === "community") {
        const data = await getDummyUserPosts(selectedUserId);
        setPosts(data);
      } else {
        const data = await getDummyUserMuscles(selectedUserId);
        setMuscles(data);
      }
    } catch (e) {
      console.error("Error fetching list:", e);
    } finally {
      setLoadingList(false);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedUserId || !content.trim()) return;
    setSaving(true);
    try {
      await createDummyPost({
        userId: selectedUserId,
        genre,
        content,
        imageFile: postImageFile || undefined,
      });
      setContent("");
      setPostImageFile(null);
      if (listType === "community") fetchList();
      alert("投稿を作成しました");
    } catch (e) {
      alert(`投稿に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMuscle = async () => {
    if (!selectedUserId || !muscleImageFile) return;
    setSaving(true);
    try {
      await createDummyMuscle({
        userId: selectedUserId,
        muscleGroup,
        imageFile: muscleImageFile,
      });
      setMuscleImageFile(null);
      if (listType === "muscle") fetchList();
      alert("最新の筋肉を投稿しました");
    } catch (e) {
      alert(`投稿に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setSaving(false);
    }
  };

  const formatEpoch = (epoch: number) => {
    return new Date(epoch * 1000).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedUserName = users.find((u) => u.id === selectedUserId)?.displayName || "";

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ユーザー選択 */}
      <div className="bg-white shadow rounded-lg p-3 lg:p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">投稿するダミーユーザー</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
        >
          <option value="">-- 選択 --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* 投稿作成 */}
          <div className="bg-white shadow rounded-lg p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">投稿作成</h3>

            {/* 投稿タイプ切替 */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPostType("community")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  postType === "community"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                コミュニティ
              </button>
              <button
                onClick={() => setPostType("muscle")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  postType === "muscle"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                最新の筋肉
              </button>
            </div>

            {postType === "community" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ジャンル</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value as PostGenre)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    {postGenreOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">本文 *</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                    rows={4}
                    placeholder="投稿内容を入力..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">画像（任意）</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPostImageFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={saving || !content.trim()}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? "投稿中..." : `${selectedUserName} として投稿`}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">部位</label>
                  <select
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                  >
                    {(Object.entries(muscleGroupLabels) as [MuscleGroup, string][]).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">画像 *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMuscleImageFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  onClick={handleCreateMuscle}
                  disabled={saving || !muscleImageFile}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? "投稿中..." : `${selectedUserName} として投稿`}
                </button>
              </div>
            )}
          </div>

          {/* 投稿一覧 */}
          <div className="bg-white shadow rounded-lg p-4 lg:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base lg:text-lg font-bold text-gray-900">投稿一覧</h3>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setListType("community")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    listType === "community"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  コミュニティ
                </button>
                <button
                  onClick={() => setListType("muscle")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    listType === "muscle"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  筋肉
                </button>
              </div>
            </div>

            {loadingList ? (
              <div className="p-8 text-center text-gray-500">読み込み中...</div>
            ) : listType === "community" ? (
              posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">投稿がありません</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {posts.map((post) => (
                    <div key={post.id} className="py-3">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          post.genre === "悩み相談" ? "bg-yellow-100 text-yellow-800" :
                          post.genre === "独り言" ? "bg-gray-100 text-gray-800" :
                          post.genre === "アドバイス" ? "bg-green-100 text-green-800" :
                          post.genre === "進捗報告" ? "bg-blue-100 text-blue-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {post.genre}
                        </span>
                        <span className="text-xs text-gray-500">{formatEpoch(post.createdAt)}</span>
                        <span className="text-xs text-gray-500">❤️ {post.likes.length}</span>
                        {post.imageURL && <span className="text-xs text-gray-400">📷</span>}
                      </div>
                      <p className="text-sm text-gray-900 break-words">{post.content}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1 truncate">{post.id}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              muscles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">投稿がありません</div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {muscles.map((muscle) => (
                    <div key={muscle.id} className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="aspect-square bg-gray-200">
                        {muscle.imageUrl && (
                          <img
                            src={muscle.imageUrl}
                            alt={muscleGroupLabels[muscle.muscleGroup]}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {muscleGroupLabels[muscle.muscleGroup]}
                        </span>
                        <div className="flex gap-2 text-xs text-gray-500 mt-1">
                          <span>❤️ {muscle.likes}</span>
                          <span>👁 {muscle.viewCount}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{formatDate(muscle.uploadedAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
