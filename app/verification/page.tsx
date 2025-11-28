"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";

type VerificationStatus = "pending" | "approved" | "rejected";

interface VerificationRequest {
  id: string;
  userId: string;
  realName: string;
  birthDate: Date;
  documentUrl: string;
  notes: string;
  submittedAt: Date;
  status: VerificationStatus;
  reviewedAt?: Date;
  reviewNote?: string;
  // ユーザー情報（追加取得）
  userDisplayName?: string;
  userEmail?: string;
}

export default function VerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reviewNote, setReviewNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, "verification_requests");
      const q = query(requestsRef, orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);

      const fetchedRequests: VerificationRequest[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();

        // ユーザー情報を取得
        let userDisplayName = "不明";
        let userEmail = "";
        try {
          const userDoc = await getDoc(doc(db, "users", docSnapshot.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userDisplayName = userData.displayName || "名前未設定";
            userEmail = userData.email || "";
          }
        } catch (e) {
          console.error("Error fetching user:", e);
        }

        fetchedRequests.push({
          id: docSnapshot.id,
          userId: data.userId || docSnapshot.id,
          realName: data.realName || "",
          birthDate: data.birthDate
            ? new Date(data.birthDate * 1000)
            : new Date(),
          documentUrl: data.documentUrl || "",
          notes: data.notes || "",
          submittedAt: data.submittedAt
            ? new Date(data.submittedAt * 1000)
            : new Date(),
          status: data.status || "pending",
          reviewedAt: data.reviewedAt ? new Date(data.reviewedAt * 1000) : undefined,
          reviewNote: data.reviewNote,
          userDisplayName,
          userEmail,
        });
      }

      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (!statusFilter) return true;
    return request.status === statusFilter;
  });

  const handleApprove = async (request: VerificationRequest) => {
    if (!confirm("この申請を承認しますか？")) return;

    setIsProcessing(true);
    try {
      // verification_requestsを更新
      await updateDoc(doc(db, "verification_requests", request.id), {
        status: "approved",
        reviewedAt: Date.now() / 1000,
        reviewNote: reviewNote || "",
      });

      // ユーザーのverificationStatusを更新
      await updateDoc(doc(db, "users", request.userId), {
        verificationStatus: "verified",
        updatedAt: Timestamp.now(),
      });

      alert("承認しました");
      setSelectedRequest(null);
      setReviewNote("");
      fetchRequests();
    } catch (error) {
      console.error("Error approving:", error);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: VerificationRequest) => {
    if (!reviewNote.trim()) {
      alert("再提出の理由を入力してください");
      return;
    }
    if (!confirm("この申請を再提出依頼しますか？")) return;

    setIsProcessing(true);
    try {
      // verification_requestsを更新
      await updateDoc(doc(db, "verification_requests", request.id), {
        status: "rejected",
        reviewedAt: Date.now() / 1000,
        reviewNote: reviewNote,
      });

      // ユーザーのverificationStatusを更新
      await updateDoc(doc(db, "users", request.userId), {
        verificationStatus: "rejected",
        updatedAt: Timestamp.now(),
      });

      alert("再提出依頼を送信しました");
      setSelectedRequest(null);
      setReviewNote("");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("エラーが発生しました");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "pending":
        return <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">審査中</span>;
      case "approved":
        return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">承認済み</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">再提出</span>;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <ProtectedLayout>
    <div className="min-h-screen bg-gray-50">
      <Header title="本人確認管理" />

      <main className="p-8">
        {/* 統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">審査待ち</div>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">承認済み</div>
            <div className="text-3xl font-bold text-green-600">
              {requests.filter(r => r.status === "approved").length}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">再提出依頼</div>
            <div className="text-3xl font-bold text-red-600">
              {requests.filter(r => r.status === "rejected").length}
            </div>
          </div>
        </div>

        {/* フィルタ */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">すべてのステータス</option>
            <option value="pending">審査中</option>
            <option value="approved">承認済み</option>
            <option value="rejected">再提出</option>
          </select>
        </div>

        {/* 一覧 */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              表示中: {filteredRequests.length}件 / 全{requests.length}件
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">本名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">生年月日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">提出日</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className={request.status === "pending" ? "bg-yellow-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.userDisplayName}</div>
                        <div className="text-xs text-gray-500">{request.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.realName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.birthDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(request.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewNote("");
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredRequests.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  申請がありません
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* 詳細モーダル */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">本人確認詳細</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ユーザー情報 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">ユーザー情報</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">{selectedRequest.userDisplayName}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.userEmail}</p>
                  <p className="text-xs text-gray-400 mt-1">ID: {selectedRequest.userId}</p>
                </div>
              </div>

              {/* 本人情報 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">本名</h3>
                  <p className="text-gray-900">{selectedRequest.realName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">生年月日</h3>
                  <p className="text-gray-900">{formatDate(selectedRequest.birthDate)}</p>
                </div>
              </div>

              {/* 提出日・ステータス */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">提出日時</h3>
                  <p className="text-gray-900">{formatDateTime(selectedRequest.submittedAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">ステータス</h3>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* 備考 */}
              {selectedRequest.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">申請者からの備考</h3>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-4">{selectedRequest.notes}</p>
                </div>
              )}

              {/* 身分証明書画像 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">身分証明書</h3>
                {selectedRequest.documentUrl ? (
                  <div className="space-y-3">
                    <img
                      src={selectedRequest.documentUrl}
                      alt="身分証明書"
                      className="max-w-full h-auto rounded-lg border"
                    />
                    <button
                      onClick={() => handleDownload(
                        selectedRequest.documentUrl,
                        `verification_${selectedRequest.userId}.jpg`
                      )}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      画像をダウンロード
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500">画像がありません</p>
                )}
              </div>

              {/* 審査済みの場合の情報 */}
              {selectedRequest.reviewedAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">審査情報</h3>
                  <p className="text-sm text-gray-600">審査日時: {formatDateTime(selectedRequest.reviewedAt)}</p>
                  {selectedRequest.reviewNote && (
                    <p className="text-sm text-gray-600 mt-1">審査メモ: {selectedRequest.reviewNote}</p>
                  )}
                </div>
              )}

              {/* 審査中の場合のアクション */}
              {selectedRequest.status === "pending" && (
                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">審査アクション</h3>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">審査メモ（再提出の場合は必須）</label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="再提出の理由や承認時のメモを入力..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isProcessing ? "処理中..." : "承認する"}
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest)}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {isProcessing ? "処理中..." : "再提出依頼"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedLayout>
  );
}
