"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  Query,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteLatestMuscleById } from "@/lib/services/hotspotService";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";

interface HotspotItem {
  id: string;
  userId: string;
  userName: string;
  imageURL: string;
  muscleGroup?: string;
  muscleName?: string;
  weeklyLikes: number;
  monthlyLikes: number;
  createdAt: Date;
}

const ITEMS_PER_PAGE = 40;

const getMuscleGroupLabel = (group?: string) => {
  switch (group) {
    case "chest":
      return "胸";
    case "back":
      return "背中";
    case "shoulders":
      return "肩";
    case "arms":
      return "腕";
    case "legs":
      return "脚";
    case "abs":
      return "腹筋";
    default:
      return "その他";
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export default function HotspotsPage() {
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // フィルター
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchHotspots();
  }, []);

  const fetchHotspots = async (
    direction: "next" | "initial" = "initial"
  ) => {
    try {
      setLoading(true);
      const hotspotsRef = collection(db, "latest_muscles");
      let q: Query<DocumentData>;

      if (direction === "initial") {
        q = query(
          hotspotsRef,
          orderBy("uploadedAt", "desc"),
          limit(ITEMS_PER_PAGE)
        );
      } else if (direction === "next" && lastVisible) {
        q = query(
          hotspotsRef,
          orderBy("uploadedAt", "desc"),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        setLoading(false);
        return;
      }

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        if (direction === "initial") {
          setHotspots([]);
        }
        setHasMore(false);
        setLoading(false);
        return;
      }

      const fetchedItems: HotspotItem[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        let imageURL = data.imageUrl || "";
        if (!imageURL && data.userTraining) {
          imageURL = data.userTraining.customImagePath || "";
          if (
            !imageURL &&
            data.userTraining.trainingMediaURLs &&
            data.userTraining.trainingMediaURLs.length > 0
          ) {
            imageURL = data.userTraining.trainingMediaURLs[0] || "";
          }
        }

        let muscleGroup = data.muscleGroup;
        if (!muscleGroup && data.userTraining?.muscleGroup) {
          muscleGroup = data.userTraining.muscleGroup;
        }

        fetchedItems.push({
          id: docSnap.id,
          userId: data.userId || "",
          userName: data.userName || "名前未設定",
          imageURL,
          muscleGroup,
          muscleName: data.userTraining?.muscleName,
          weeklyLikes: data.weeklyLikes || 0,
          monthlyLikes: data.monthlyLikes || 0,
          createdAt:
            data.uploadedAt instanceof Timestamp
              ? data.uploadedAt.toDate()
              : new Date(),
        });
      });

      setHotspots(fetchedItems);
      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);

      if (direction === "next") {
        setCurrentPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("ホットスポット取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      fetchHotspots("next");
    }
  };

  const handleDelete = async (item: HotspotItem) => {
    if (
      !confirm(
        `${item.userName} のホットスポット（${getMuscleGroupLabel(item.muscleGroup)}）を削除しますか？\n関連するデータ・画像も全て削除されます。`
      )
    )
      return;

    try {
      setDeleting(item.id);
      await deleteLatestMuscleById(item.id);
      setHotspots((prev) => prev.filter((h) => h.id !== item.id));
      alert("削除が完了しました");
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  const filteredHotspots = hotspots.filter((item) => {
    const matchesGroup =
      !muscleGroupFilter || item.muscleGroup === muscleGroupFilter;
    const matchesSearch = item.userName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  const sortedHotspots = [...filteredHotspots].sort((a, b) => {
    if (sortBy === "likes") return b.monthlyLikes - a.monthlyLikes;
    if (sortBy === "weeklyLikes") return b.weeklyLikes - a.weeklyLikes;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <Header title="ホットスポット管理" />

        <main className="p-8">
          {/* 統計 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">現在のページ</div>
              <div className="text-3xl font-bold text-gray-900">
                {hotspots.length}件
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">ページ番号</div>
              <div className="text-3xl font-bold text-blue-600">
                {currentPage}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600 mb-2">総いいね数</div>
              <div className="text-3xl font-bold text-pink-600">
                {hotspots.reduce((sum, p) => sum + p.monthlyLikes, 0)}
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
              <button
                onClick={() => fetchHotspots("initial")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                更新
              </button>
            </div>
          </div>

          {/* グリッド */}
          {loading ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-gray-500">読み込み中...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-6">
                {sortedHotspots.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                  >
                    {/* 写真プレビュー */}
                    <div className="aspect-square bg-gray-100 relative">
                      {item.imageURL ? (
                        <img
                          src={item.imageURL}
                          alt={`${item.userName}のホットスポット`}
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
                          {item.userName.charAt(0)}
                        </div>
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {item.userName}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        {item.muscleGroup && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getMuscleGroupLabel(item.muscleGroup)}
                          </span>
                        )}
                        {item.muscleName && (
                          <span className="text-xs text-gray-600 truncate">
                            {item.muscleName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>月: {item.monthlyLikes}</span>
                        <span>週: {item.weeklyLikes}</span>
                      </div>

                      <div className="text-xs text-gray-500 mb-2">
                        {formatDate(item.createdAt)}
                      </div>

                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deleting === item.id}
                        className="w-full bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {deleting === item.id ? "削除中..." : "削除"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {sortedHotspots.length === 0 && !loading && (
                <div className="bg-white shadow rounded-lg p-12 text-center">
                  <p className="text-gray-500">
                    ホットスポットが見つかりませんでした
                  </p>
                </div>
              )}

              {/* ページネーション */}
              <div className="flex justify-between items-center bg-white shadow rounded-lg p-6">
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setLastVisible(null);
                    fetchHotspots("initial");
                  }}
                  disabled={currentPage === 1}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  最初へ
                </button>

                <div className="text-sm text-gray-700">
                  ページ {currentPage} - 表示中: {sortedHotspots.length}件 /
                  40件
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
