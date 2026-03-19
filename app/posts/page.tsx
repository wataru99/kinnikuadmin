"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, Timestamp, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";
import { adminDeleteCommunityPost } from "@/lib/services/adminDeleteService";

type PostGenre = "すべて" | "悩み相談" | "独り言" | "アドバイス" | "進捗報告" | "その他";

interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userMyTrainingIconURL?: string;
  genre: PostGenre;
  content: string;
  imageURL?: string;
  createdAt: Date;
  likes: string[];
  replyCount?: number;
  reportCount?: number;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [genreFilter, setGenreFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, "community_posts");
      const q = query(postsRef, orderBy("createdAt", "desc"), limit(100));
      const querySnapshot = await getDocs(q);

      const fetchedPosts: CommunityPost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPosts.push({
          id: doc.id,
          userId: data.userId || "",
          userName: data.userName || "名前未設定",
          userMyTrainingIconURL: data.userMyTrainingIconURL,
          genre: data.genre || "その他",
          content: data.content || "",
          imageURL: data.imageURL,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(),
          likes: data.likes || [],
          replyCount: 0, // これは実際にはサブコレクションから取得する必要があります
          reportCount: 0, // これも別途実装が必要
        });
      });

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("この投稿を削除しますか？画像・返信も全て削除されます。")) return;
    setDeletingId(postId);
    try {
      await adminDeleteCommunityPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesGenre = !genreFilter || post.genre === genreFilter;
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const todayPosts = posts.filter(post => {
    const today = new Date();
    const postDate = post.createdAt;
    return postDate.toDateString() === today.toDateString();
  });

  const reportedPosts = posts.filter(post => (post.reportCount || 0) > 0);

  const getGenreLabel = (genre: PostGenre) => {
    return genre;
  };

  const getGenreColor = (genre: PostGenre) => {
    switch (genre) {
      case "悩み相談": return "bg-yellow-100 text-yellow-800";
      case "独り言": return "bg-gray-100 text-gray-800";
      case "アドバイス": return "bg-green-100 text-green-800";
      case "進捗報告": return "bg-blue-100 text-blue-800";
      default: return "bg-purple-100 text-purple-800";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <ProtectedLayout>
    <div className="min-h-screen bg-gray-50">
      <Header title="コミュニティ投稿管理" />

      <main className="p-8">
        {/* フィルタ */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全てのジャンル</option>
              <option value="悩み相談">悩み相談</option>
              <option value="独り言">独り言</option>
              <option value="アドバイス">アドバイス</option>
              <option value="進捗報告">進捗報告</option>
              <option value="その他">その他</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">全てのステータス</option>
              <option value="active">公開中</option>
              <option value="reported">通報あり</option>
              <option value="deleted">削除済み</option>
            </select>
            <input
              type="text"
              placeholder="投稿内容・ユーザー名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 投稿一覧 */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              表示中: {filteredPosts.length}件 / 全{posts.length}件
            </div>
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`px-4 py-3 hover:bg-gray-50 ${
                    (post.reportCount || 0) > 0 ? "bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mr-3 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {post.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">{post.userName}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getGenreColor(post.genre)}`}>
                            {getGenreLabel(post.genre)}
                          </span>
                          {(post.reportCount || 0) > 0 && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800">
                              通報{post.reportCount}
                            </span>
                          )}
                          {post.imageURL && (
                            <span className="text-xs text-gray-400">📷</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm truncate">{post.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                      <span className="text-xs text-gray-500">❤️{post.likes.length}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingId === post.id}
                          className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                        >
                          {deletingId === post.id ? "削除中..." : "削除"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPosts.length === 0 && !loading && (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-500">投稿が見つかりませんでした</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
    </ProtectedLayout>
  );
}
