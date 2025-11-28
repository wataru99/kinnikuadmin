"use client";

import Header from "@/components/Header";

export default function AdsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="広告管理" />
      <main className="p-8">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">広告管理</h2>
          <p className="text-gray-600">バナー広告設定、広告表示設定</p>
        </div>
      </main>
    </div>
  );
}
