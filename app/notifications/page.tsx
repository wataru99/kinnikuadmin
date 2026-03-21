"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function NotificationsPage() {
  const [roomId, setRoomId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [savedRoomId, setSavedRoomId] = useState("");
  const [savedEnabled, setSavedEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const snap = await getDoc(doc(db, "settings", "chatwork"));
      if (snap.exists()) {
        const data = snap.data();
        setRoomId(data.roomId || "");
        setSavedRoomId(data.roomId || "");
        setApiToken(data.apiToken || "");
        setEnabled(data.enabled ?? true);
        setSavedEnabled(data.enabled ?? false);
      }
    } catch (error) {
      console.error("設定の読み込みに失敗:", error);
      setStatus({ type: "error", message: "設定の読み込みに失敗しました" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!roomId.trim()) {
      setStatus({ type: "error", message: "ルームIDを入力してください" });
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      await setDoc(doc(db, "settings", "chatwork"), {
        roomId: roomId.trim(),
        apiToken: apiToken.trim(),
        enabled,
        updatedAt: new Date().toISOString(),
      });
      setSavedRoomId(roomId.trim());
      setSavedEnabled(enabled);
      setStatus({ type: "success", message: "保存しました" });
    } catch (error) {
      console.error("保存エラー:", error);
      setStatus({ type: "error", message: "保存に失敗しました" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSend() {
    if (!savedRoomId) {
      setStatus({
        type: "error",
        message: "先にルームIDを保存してください",
      });
      return;
    }

    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/chatwork-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user_registered",
          data: {
            userId: "test-user-000",
            displayName: "テストユーザー",
            gender: "male",
          },
        }),
      });

      if (res.ok) {
        setStatus({
          type: "success",
          message: "テスト送信に成功しました。Chatworkを確認してください",
        });
      } else {
        const errorData = await res.json();
        setStatus({
          type: "error",
          message: `テスト送信に失敗: ${errorData.error || res.statusText}`,
        });
      }
    } catch (error) {
      console.error("テスト送信エラー:", error);
      setStatus({ type: "error", message: "テスト送信に失敗しました" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <Header title="通知設定" />
        <main className="p-8">
          <div className="max-w-2xl">
            {/* Chatwork設定 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Chatwork通知設定
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                新規ユーザー登録時にChatworkルームへ通知を送信します
              </p>

              {loading ? (
                <div className="text-gray-500 text-sm">読み込み中...</div>
              ) : (
                <div className="space-y-4">
                  {/* 通知ON/OFF */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        通知を有効にする
                      </span>
                      <p className="text-xs text-gray-400">
                        OFFにすると通知が送信されません
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => setEnabled(!enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* APIトークン入力 */}
                  <div>
                    <label
                      htmlFor="apiToken"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Chatwork APIトークン
                    </label>
                    <input
                      id="apiToken"
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="APIトークンを入力"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Chatworkの管理画面から取得したAPIトークンを入力してください
                    </p>
                  </div>

                  {/* ルームID入力 */}
                  <div>
                    <label
                      htmlFor="roomId"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ChatworkルームID
                    </label>
                    <input
                      id="roomId"
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="例: 123456789"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      通知先のChatworkルームIDを入力してください
                    </p>
                  </div>

                  {/* ステータス表示 */}
                  {status && (
                    <div
                      className={`px-4 py-3 rounded-lg text-sm ${
                        status.type === "success"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : status.type === "error"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {status.message}
                    </div>
                  )}

                  {/* ボタン群 */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving || !roomId.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? "保存中..." : "保存"}
                    </button>
                    <button
                      onClick={handleTestSend}
                      disabled={testing || !savedRoomId}
                      className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {testing ? "送信中..." : "テスト送信"}
                    </button>
                  </div>

                  {/* 現在の状態 */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      ステータス:{" "}
                      {savedRoomId ? (
                        savedEnabled ? (
                          <span className="text-green-600 font-medium">
                            有効（ルームID: {savedRoomId}）
                          </span>
                        ) : (
                          <span className="text-orange-500 font-medium">
                            無効（ルームID: {savedRoomId}）
                          </span>
                        )
                      ) : (
                        <span className="text-orange-500 font-medium">
                          未設定
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
