"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, Timestamp, Query, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";

interface MusclePhoto {
  id: string;
  userId: string;
  userName: string;
  userMyTrainingIconURL?: string;
  imageURL: string;
  muscleGroup?: string;
  weeklyLikes: number;
  monthlyLikes: number;
  createdAt: Date;
  reportCount?: number;
}

const ITEMS_PER_PAGE = 40;

export default function PhotosPage() {
  const [photos, setPhotos] = useState<MusclePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // フィルター
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
    try {
      setLoading(true);
      const photosRef = collection(db, "latest_muscles");
      let q: Query<DocumentData>;

      if (direction === 'initial') {
        q = query(photosRef, orderBy("uploadedAt", "desc"), limit(ITEMS_PER_PAGE));
      } else if (direction === 'next' && lastVisible) {
        q = query(photosRef, orderBy("uploadedAt", "desc"), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      } else if (direction === 'prev' && firstVisible) {
        // 前のページに戻る処理（簡易版）
        setCurrentPage(prev => Math.max(1, prev - 1));
        setLoading(false);
        return;
      } else {
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const fetchedPhotos: MusclePhoto[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // 画像URLを取得（優先順位: imageUrl > userTraining.customImagePath > userTraining.trainingMediaURLs[0]）
        let imageURL = data.imageUrl || "";
        if (!imageURL && data.userTraining) {
          imageURL = data.userTraining.customImagePath || "";
          if (!imageURL && data.userTraining.trainingMediaURLs && data.userTraining.trainingMediaURLs.length > 0) {
            imageURL = data.userTraining.trainingMediaURLs[0] || "";
          }
        }

        // 筋肉グループを取得
        let muscleGroup = data.muscleGroup;
        if (!muscleGroup && data.userTraining && data.userTraining.muscleGroup) {
          muscleGroup = data.userTraining.muscleGroup;
        }

        fetchedPhotos.push({
          id: doc.id,
          userId: data.userId || "",
          userName: data.userName || "名前未設定",
          userMyTrainingIconURL: data.userProfileImageUrl || data.userMyTrainingIconURL,
          imageURL: imageURL,
          muscleGroup: muscleGroup,
          weeklyLikes: data.weeklyLikes || 0,
          monthlyLikes: data.monthlyLikes || 0,
          createdAt: data.uploadedAt instanceof Timestamp
            ? data.uploadedAt.toDate()
            : new Date(),
          reportCount: 0, // 通報機能は別途実装
        });
      });

      setPhotos(fetchedPhotos);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setFirstVisible(querySnapshot.docs[0]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);

      // ページカウント更新
      if (direction === 'next') {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      fetchPhotos('next');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchPhotos('prev');
    }
  };

  const filteredPhotos = photos.filter((photo) => {
    const matchesGroup = !muscleGroupFilter || photo.muscleGroup === muscleGroupFilter;
    const matchesSearch = photo.userName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  // ソート処理
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === "likes") return b.monthlyLikes - a.monthlyLikes;
    if (sortBy === "weeklyLikes") return b.weeklyLikes - a.weeklyLikes;
    return b.createdAt.getTime() - a.createdAt.getTime(); // date
  });

  const getMuscleGroupLabel = (group?: string) => {
    switch (group) {
      case "chest": return "胸";
      case "back": return "背中";
      case "shoulders": return "肩";
      case "arms": return "腕";
      case "legs": return "脚";
      case "abs": return "腹筋";
      default: return "その他";
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
    <ProtectedLayout>
    <div className="min-h-screen bg-gray-50">
      <Header title="筋肉写真管理" />

      <main className="p-8">
        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">現在のページ</div>
            <div className="text-3xl font-bold text-gray-900">{photos.length}件</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">ページ番号</div>
            <div className="text-3xl font-bold text-blue-600">{currentPage}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">総いいね数</div>
            <div className="text-3xl font-bold text-pink-600">
              {photos.reduce((sum, p) => sum + p.monthlyLikes, 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">通報済み</div>
            <div className="text-3xl font-bold text-red-600">
              {photos.filter(p => (p.reportCount || 0) > 0).length}
            </div>
          </div>
        </div>

        {/* フィルタ */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={muscleGroupFilter}
              onChange={(e) => setMuscleGroupFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全ての部位</option>
              <option value="chest">胸</option>
              <option value="back">背中</option>
              <option value="shoulders">肩</option>
              <option value="arms">腕</option>
              <option value="legs">脚</option>
              <option value="abs">腹筋</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">全てのステータス</option>
              <option value="public">公開中</option>
              <option value="reported">通報あり</option>
              <option value="hidden">非表示</option>
            </select>
            <input
              type="text"
              placeholder="ユーザー名で検索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">投稿日順</option>
              <option value="likes">月間いいね順</option>
              <option value="weeklyLikes">週間いいね順</option>
            </select>
          </div>
        </div>

        {/* 写真グリッド */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-6">
              {sortedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                    (photo.reportCount || 0) > 0 ? "ring-2 ring-red-500" : ""
                  }`}
                >
                  {/* 写真プレビュー */}
                  <div className="aspect-square bg-gray-100 relative">
                    {photo.imageURL ? (
                      <img
                        src={photo.imageURL}
                        alt={`${photo.userName}の筋肉写真`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "";
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 text-white text-sm font-medium">
                        画像
                      </div>
                    )}
                  </div>

                  {/* 情報 */}
                  <div className="p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold">
                        {photo.userName.charAt(0)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {photo.userName}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      {photo.muscleGroup && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getMuscleGroupLabel(photo.muscleGroup)}
                        </span>
                      )}
                      {(photo.reportCount || 0) > 0 && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          通報 {photo.reportCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>月: {photo.monthlyLikes}</span>
                      <span>週: {photo.weeklyLikes}</span>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      {formatDate(photo.createdAt)}
                    </div>

                    <div className="flex space-x-1">
                      <button className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">
                        詳細
                      </button>
                      <button className="flex-1 bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-300">
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sortedPhotos.length === 0 && !loading && (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-500">写真が見つかりませんでした</p>
              </div>
            )}

            {/* ページネーション */}
            <div className="flex justify-between items-center bg-white shadow rounded-lg p-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                前へ
              </button>

              <div className="text-sm text-gray-700">
                ページ {currentPage} - 表示中: {sortedPhotos.length}件 / 40件
              </div>

              <button
                onClick={handleNextPage}
                disabled={!hasMore}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          </>
        )}
      </main>
    </div>
    </ProtectedLayout>
  );
}
