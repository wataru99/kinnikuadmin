"use client";

import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="ダッシュボード" />

      {/* メインコンテンツ */}
      <main className="p-8">
        {/* 最近のアクティビティ */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            最近のアクティビティ
          </h2>
          <div className="space-y-4">
            <ActivityItem
              text="新規ユーザー登録: 田中太郎"
              time="5分前"
            />
            <ActivityItem
              text="新規投稿: 「ベンチプレス100kg達成！」"
              time="15分前"
            />
            <ActivityItem
              text="投稿が通報されました"
              time="30分前"
              warning
            />
            <ActivityItem
              text="サービス購入: パーソナルトレーニング"
              time="1時間前"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityItem({
  text,
  time,
  warning = false,
}: {
  text: string;
  time: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`flex items-center p-3 rounded-lg ${
        warning ? "bg-red-50" : "bg-gray-50"
      }`}
    >
      <div className="flex-1">
        <p
          className={`text-sm font-medium ${
            warning ? "text-red-900" : "text-gray-900"
          }`}
        >
          {text}
        </p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
