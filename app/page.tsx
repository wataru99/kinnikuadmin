"use client";

import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";

export default function Home() {
  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <Header title="ダッシュボード" />

        {/* メインコンテンツ */}
        <main className="p-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              管理画面へようこそ
            </h2>
            <p className="text-gray-600">
              左のメニューから管理したい項目を選択してください。
            </p>
          </div>
        </main>
      </div>
    </ProtectedLayout>
  );
}
