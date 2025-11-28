"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

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

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, "community_posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
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
    <div className="min-h-screen bg-gray-50">
      <Header title="コミュニティ投稿管理" />

      <main className="p-8">
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">総投稿数</div>
            <div className="text-3xl font-bold text-gray-900">{posts.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">今日の投稿</div>
            <div className="text-3xl font-bold text-blue-600">{todayPosts.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">通報済み</div>
            <div className="text-3xl font-bold text-red-600">{reportedPosts.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">総いいね数</div>
            <div className="text-3xl font-bold text-pink-600">
              {posts.reduce((sum, post) => sum + post.likes.length, 0)}
            </div>
          </div>
        </div>

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
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`bg-white shadow rounded-lg p-6 ${
                    (post.reportCount || 0) > 0 ? "border-2 border-red-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mr-4 flex items-center justify-center text-white font-bold">
                        {post.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{post.userName}</div>
                        <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getGenreColor(post.genre)}`}>
                        {getGenreLabel(post.genre)}
                      </span>
                      {(post.reportCount || 0) > 0 && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          通報 {post.reportCount}件
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                  {post.imageURL && (
                    <div className="mb-4">
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">画像あり</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>いいね: {post.likes.length}</span>
                      <span>返信: {post.replyCount || 0}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        詳細を見る
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                        非表示
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                        削除
                      </button>
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
  );
}
