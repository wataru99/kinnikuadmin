"use client";

import { useState, useEffect, useCallback } from "react";
import { DummyUser, ActionLog } from "@/lib/types/dummyUser";
import {
  getAllLatestMuscles,
  autoLikeAllMuscles,
  autoAddViewsAllMuscles,
} from "@/lib/services/dummyUserService";

interface Props {
  users: DummyUser[];
}

interface Stats {
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
}

export default function AutoOperationTab({ users }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // いいね設定
  const [minLikes, setMinLikes] = useState(3);
  const [maxLikes, setMaxLikes] = useState(8);
  const [likesExecuting, setLikesExecuting] = useState(false);

  // 閲覧数設定
  const [minViews, setMinViews] = useState(10);
  const [maxViews, setMaxViews] = useState(50);
  const [viewsExecuting, setViewsExecuting] = useState(false);

  // 実行ログ
  const [logs, setLogs] = useState<ActionLog[]>([]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const muscles = await getAllLatestMuscles();
      setStats({
        totalPosts: muscles.length,
        totalLikes: muscles.reduce((sum, m) => sum + m.likes, 0),
        totalViews: muscles.reduce((sum, m) => sum + m.viewCount, 0),
      });
    } catch (e) {
      console.error("統計取得エラー:", e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 非表示でないダミーユーザーのIDリスト
  const activeSakuraIds = users.filter((u) => !u.isHidden).map((u) => u.id);

  const handleAutoLike = async () => {
    if (activeSakuraIds.length === 0) {
      alert("利用可能なダミーユーザーがいません");
      return;
    }
    if (minLikes > maxLikes) {
      alert("最小いいね数は最大いいね数以下にしてください");
      return;
    }

    setLikesExecuting(true);
    try {
      const result = await autoLikeAllMuscles({
        sakuraUserIds: activeSakuraIds,
        minLikes,
        maxLikes,
      });

      const log: ActionLog = {
        timestamp: new Date(),
        action: "自動いいね一括付与",
        result: result.errors.length === 0 ? "success" : "error",
        detail: `${result.totalProcessed}件の投稿に合計${result.totalLikesAdded}件のいいねを付与しました${
          result.errors.length > 0 ? ` (エラー: ${result.errors.length}件)` : ""
        }`,
      };
      setLogs((prev) => [log, ...prev]);
      await fetchStats();
    } catch (e) {
      const log: ActionLog = {
        timestamp: new Date(),
        action: "自動いいね一括付与",
        result: "error",
        detail: e instanceof Error ? e.message : "不明なエラー",
      };
      setLogs((prev) => [log, ...prev]);
    } finally {
      setLikesExecuting(false);
    }
  };

  const handleAutoViews = async () => {
    if (minViews > maxViews) {
      alert("最小閲覧数は最大閲覧数以下にしてください");
      return;
    }

    setViewsExecuting(true);
    try {
      const result = await autoAddViewsAllMuscles({
        minViews,
        maxViews,
      });

      const log: ActionLog = {
        timestamp: new Date(),
        action: "自動閲覧数一括付与",
        result: result.errors.length === 0 ? "success" : "error",
        detail: `${result.totalProcessed}件の投稿に合計${result.totalViewsAdded}件の閲覧数を付与しました${
          result.errors.length > 0 ? ` (エラー: ${result.errors.length}件)` : ""
        }`,
      };
      setLogs((prev) => [log, ...prev]);
      await fetchStats();
    } catch (e) {
      const log: ActionLog = {
        timestamp: new Date(),
        action: "自動閲覧数一括付与",
        result: "error",
        detail: e instanceof Error ? e.message : "不明なエラー",
      };
      setLogs((prev) => [log, ...prev]);
    } finally {
      setViewsExecuting(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4">
        <div className="bg-white shadow rounded-lg p-4 lg:p-6 text-center">
          <div className="text-xs lg:text-sm text-gray-500 mb-1">総投稿数</div>
          <div className="text-xl lg:text-2xl font-bold text-gray-900">
            {statsLoading ? "..." : stats?.totalPosts ?? "-"}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 lg:p-6 text-center">
          <div className="text-xs lg:text-sm text-gray-500 mb-1">総いいね数</div>
          <div className="text-xl lg:text-2xl font-bold text-pink-600">
            {statsLoading ? "..." : stats?.totalLikes ?? "-"}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 lg:p-6 text-center">
          <div className="text-xs lg:text-sm text-gray-500 mb-1">総閲覧数</div>
          <div className="text-xl lg:text-2xl font-bold text-blue-600">
            {statsLoading ? "..." : stats?.totalViews ?? "-"}
          </div>
        </div>
      </div>

      {/* いいね自動付与 */}
      <div className="bg-white shadow rounded-lg p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-1">いいね自動付与</h3>
        <p className="text-xs text-gray-500 mb-3">
          全投稿にランダム数のダミーユーザーからいいねを付与（対象: {activeSakuraIds.length}人）
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最小いいね数</label>
            <input
              type="number"
              value={minLikes}
              onChange={(e) => setMinLikes(Number(e.target.value))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大いいね数</label>
            <input
              type="number"
              value={maxLikes}
              onChange={(e) => setMaxLikes(Number(e.target.value))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
        </div>

        <button
          onClick={handleAutoLike}
          disabled={likesExecuting || viewsExecuting}
          className="w-full bg-pink-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {likesExecuting ? "実行中..." : "いいねを自動付与"}
        </button>
      </div>

      {/* 閲覧数自動付与 */}
      <div className="bg-white shadow rounded-lg p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-1">閲覧数自動付与</h3>
        <p className="text-xs text-gray-500 mb-3">
          全投稿にランダム数の閲覧数を付与
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最小閲覧数</label>
            <input
              type="number"
              value={minViews}
              onChange={(e) => setMinViews(Number(e.target.value))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">最大閲覧数</label>
            <input
              type="number"
              value={maxViews}
              onChange={(e) => setMaxViews(Number(e.target.value))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
        </div>

        <button
          onClick={handleAutoViews}
          disabled={likesExecuting || viewsExecuting}
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {viewsExecuting ? "実行中..." : "閲覧数を自動付与"}
        </button>
      </div>

      {/* 実行ログ */}
      {logs.length > 0 && (
        <div className="bg-white shadow rounded-lg p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">実行ログ</h3>
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  log.result === "success"
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-gray-900 break-words min-w-0">
                    {log.action}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                      log.result === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.result === "success" ? "成功" : "エラー"}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">{log.detail}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {log.timestamp.toLocaleString("ja-JP")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
