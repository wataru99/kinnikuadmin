"use client";

import { useState, useEffect } from "react";
import {
  getUserHotspots,
  deleteHotspotComplete,
  Hotspot,
} from "@/lib/services/hotspotService";

interface UserHotspotsModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

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

export default function UserHotspotsModal({
  userId,
  userName,
  onClose,
}: UserHotspotsModalProps) {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchHotspots();
  }, [userId]);

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      const data = await getUserHotspots(userId);
      setHotspots(data);
    } catch (error) {
      console.error("ホットスポット取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (hotspot: Hotspot) => {
    if (
      !confirm(
        `このホットスポット（${getMuscleGroupLabel(hotspot.muscleGroup)} - ${hotspot.muscleName || "不明"}）を削除しますか？\n関連するタイムライン投稿・画像も全て削除されます。`
      )
    )
      return;

    try {
      setDeleting(hotspot.id);
      await deleteHotspotComplete(userId, hotspot.id);
      setHotspots((prev) => prev.filter((h) => h.id !== hotspot.id));
      alert("削除が完了しました");
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  const getImageUrl = (hotspot: Hotspot): string => {
    return (
      hotspot.customImagePath ||
      (hotspot.trainingMediaURLs && hotspot.trainingMediaURLs[0]) ||
      hotspot.imageUrl ||
      ""
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {userName} のホットスポット
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : hotspots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              ホットスポットがありません
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 mb-2">
                {hotspots.length}件のホットスポット
              </div>
              {hotspots.map((hotspot) => {
                const imageUrl = getImageUrl(hotspot);
                return (
                  <div
                    key={hotspot.id}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    {/* サムネイル */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="ホットスポット"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 text-white text-xs">
                          画像
                        </div>
                      )}
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getMuscleGroupLabel(hotspot.muscleGroup)}
                        </span>
                        {hotspot.muscleName && (
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {hotspot.muscleName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        更新日: {formatDate(hotspot.updatedAt)}
                      </div>
                    </div>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleDelete(hotspot)}
                      disabled={deleting === hotspot.id}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      {deleting === hotspot.id ? "削除中..." : "削除"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
