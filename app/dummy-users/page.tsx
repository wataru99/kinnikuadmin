"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";
import { DummyUser } from "@/lib/types/dummyUser";
import { getDummyUsers } from "@/lib/services/dummyUserService";
import UserListTab from "./UserListTab";
import MyTrainingTab from "./MyTrainingTab";
import PostManagementTab from "./PostManagementTab";
import ActionsTab from "./ActionsTab";
import AutoOperationTab from "./AutoOperationTab";

type TabId = "users" | "mytraining" | "posts" | "actions" | "auto";

const tabs: { id: TabId; label: string }[] = [
  { id: "users", label: "ユーザー" },
  { id: "mytraining", label: "マイトレ" },
  { id: "posts", label: "投稿管理" },
  { id: "actions", label: "アクション" },
  { id: "auto", label: "自動運用" },
];

export default function DummyUsersPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [users, setUsers] = useState<DummyUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getDummyUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error fetching dummy users:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <Header title="ダミーユーザー管理" />

        <main className="p-3 sm:p-4 lg:p-8">
          {/* タブ切替 */}
          <div className="bg-white shadow rounded-lg mb-4 lg:mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-0 px-2 sm:px-5 py-3 lg:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* タブコンテンツ */}
          {activeTab === "users" && (
            <UserListTab users={users} loading={loading} onRefresh={fetchUsers} />
          )}
          {activeTab === "mytraining" && (
            <MyTrainingTab users={users} />
          )}
          {activeTab === "posts" && (
            <PostManagementTab users={users} />
          )}
          {activeTab === "actions" && (
            <ActionsTab users={users} />
          )}
          {activeTab === "auto" && (
            <AutoOperationTab />
          )}
        </main>
      </div>
    </ProtectedLayout>
  );
}
