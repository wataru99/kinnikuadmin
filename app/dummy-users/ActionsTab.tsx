"use client";

import { useState } from "react";
import {
  DummyUser,
  BulkActionType,
  ActionLog,
} from "@/lib/types/dummyUser";
import { executeBulkAction } from "@/lib/services/dummyUserService";

interface Props {
  users: DummyUser[];
}

export default function ActionsTab({ users }: Props) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [actionType, setActionType] = useState<BulkActionType>("like_post");
  const [targetId, setTargetId] = useState("");
  const [viewCount, setViewCount] = useState(10);
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map((u) => u.id)));
    }
  };

  const actionLabels: Record<BulkActionType, string> = {
    like_post: "投稿にいいね",
    like_muscle: "筋肉にいいね",
    add_view: "閲覧数追加",
  };

  const handlePreview = () => {
    if (actionType !== "add_view" && selectedUserIds.size === 0) {
      alert("サクラユーザーを選択してください");
      return;
    }
    if (!targetId.trim()) {
      alert("ターゲットIDを入力してください");
      return;
    }
    setShowPreview(true);
  };

  const handleExecute = async () => {
    setShowPreview(false);
    setExecuting(true);

    const userIds = actionType === "add_view"
      ? Array.from({ length: viewCount }, (_, i) => `view_${i}`)
      : Array.from(selectedUserIds);

    try {
      const result = await executeBulkAction({
        actionType,
        sakuraUserIds: userIds,
        targetId: targetId.trim(),
      });

      const log: ActionLog = {
        timestamp: new Date(),
        action: `${actionLabels[actionType]} → ${targetId.slice(0, 12)}...`,
        result: result.errors.length === 0 ? "success" : "error",
        detail: `成功: ${result.success}件${result.errors.length > 0 ? `, エラー: ${result.errors.length}件` : ""}`,
      };
      setLogs((prev) => [log, ...prev]);
    } catch (e) {
      const log: ActionLog = {
        timestamp: new Date(),
        action: `${actionLabels[actionType]} → ${targetId.slice(0, 12)}...`,
        result: "error",
        detail: e instanceof Error ? e.message : "不明なエラー",
      };
      setLogs((prev) => [log, ...prev]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* サクラユーザー選択 */}
      <div className="bg-white shadow rounded-lg p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base lg:text-lg font-bold text-gray-900">ユーザー選択</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs lg:text-sm text-gray-600">{selectedUserIds.size}人</span>
            <button
              onClick={selectAll}
              className="text-xs lg:text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedUserIds.size === users.length ? "全解除" : "全選択"}
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">ダミーユーザーがいません</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {users.map((user) => (
              <label
                key={user.id}
                className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedUserIds.has(user.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-900 truncate">{user.displayName}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* アクション設定 */}
      <div className="bg-white shadow rounded-lg p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">アクション設定</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as BulkActionType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
            >
              {(Object.entries(actionLabels) as [BulkActionType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ターゲットID</label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="ドキュメントIDを入力"
            />
          </div>

          {actionType === "add_view" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">追加閲覧数</label>
              <input
                type="number"
                value={viewCount}
                onChange={(e) => setViewCount(Number(e.target.value))}
                min={1}
                max={1000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={executing}
            className="w-full bg-yellow-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {executing ? "実行中..." : "プレビュー"}
          </button>
        </div>
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
                  <span className="text-sm font-medium text-gray-900 break-words min-w-0">{log.action}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
                    log.result === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
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

      {/* プレビューモーダル */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md">
            <div className="p-4 lg:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">アクション確認</h2>

              <div className="space-y-2 mb-5">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">アクション</div>
                  <div className="text-sm font-medium text-gray-900">{actionLabels[actionType]}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">ターゲットID</div>
                  <div className="font-mono text-xs text-gray-900 break-all">{targetId}</div>
                </div>
                {actionType === "add_view" ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">追加閲覧数</div>
                    <div className="text-sm font-medium text-gray-900">{viewCount}</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-500">実行ユーザー</div>
                    <div className="text-sm font-medium text-gray-900">{selectedUserIds.size}人</div>
                    <div className="text-xs text-gray-500 mt-1 max-h-20 overflow-y-auto break-words">
                      {users
                        .filter((u) => selectedUserIds.has(u.id))
                        .map((u) => u.displayName)
                        .join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExecute}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-red-700"
                >
                  実行
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
