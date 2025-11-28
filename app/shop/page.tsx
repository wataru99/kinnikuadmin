"use client";

import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getProducts } from "@/lib/services/productService";
import { getOrders, getOrderStats, updateOrderStatus } from "@/lib/services/orderService";
import {
  getEmailTemplates,
  updateEmailTemplate,
  seedEmailTemplates,
  seedSingleTemplate,
  templateTypeLabels,
  templateTypeDescriptions,
  availableVariables,
  type EmailTemplate,
  type EmailTemplateType,
} from "@/lib/services/emailTemplateService";
import { categoryLabels, statusLabels, type Product, type Order } from "@/lib/types";

type TabType = "products" | "orders" | "emails";

const ITEMS_PER_PAGE = 50;

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState<TabType>("products");
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
  const [productPage, setProductPage] = useState(1);

  // データ状態
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState({ pending: 0, processing: 0, shipped: 0, delivered: 0, totalSales: 0 });
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // メール編集モーダル
  const [showEmailEditModal, setShowEmailEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // 処理中状態
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [productsData, ordersData, stats, templates] = await Promise.all([
          getProducts(),
          getOrders(),
          getOrderStats(),
          getEmailTemplates(),
        ]);
        setProducts(productsData);
        setOrders(ordersData);
        setOrderStats(stats);
        setEmailTemplates(templates);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました。Firestoreにデータを投入してください。");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 商品フィルタリング
  const filteredProducts = products.filter(product => {
    if (productCategoryFilter === "all") return true;
    return product.category === productCategoryFilter;
  });

  // ページネーション計算
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
  const startIndex = (productPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // ページ変更時にフィルターをリセット
  const handleCategoryFilterChange = (category: string) => {
    setProductCategoryFilter(category);
    setProductPage(1);
  };

  // 注文ステータス更新
  const handleOrderStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // 一覧を更新
      const [ordersData, stats] = await Promise.all([
        getOrders(),
        getOrderStats(),
      ]);
      setOrders(ordersData);
      setOrderStats(stats);
    } catch (err) {
      console.error("ステータス更新エラー:", err);
      alert("ステータスの更新に失敗しました");
    }
  };

  // メールテンプレート更新
  const handleEmailTemplateUpdate = async (type: EmailTemplateType, subject: string, body: string) => {
    try {
      await updateEmailTemplate(type, { subject, body });
      const templates = await getEmailTemplates();
      setEmailTemplates(templates);
      setShowEmailEditModal(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error("テンプレート更新エラー:", err);
      alert("テンプレートの更新に失敗しました");
    }
  };

  // 初期テンプレート投入
  const handleSeedTemplates = async () => {
    try {
      await seedEmailTemplates();
      const templates = await getEmailTemplates();
      setEmailTemplates(templates);
      alert("メールテンプレートを作成しました");
    } catch (err) {
      console.error("テンプレート作成エラー:", err);
      alert("テンプレートの作成に失敗しました");
    }
  };

  // 個別テンプレート投入
  const handleSeedSingleTemplate = async (type: EmailTemplateType) => {
    try {
      await seedSingleTemplate(type);
      const templates = await getEmailTemplates();
      setEmailTemplates(templates);
      alert(`${templateTypeLabels[type]}を作成しました`);
    } catch (err) {
      console.error("テンプレート作成エラー:", err);
      alert("テンプレートの作成に失敗しました");
    }
  };

  // 振込確認処理（メール送信 + ステータス更新）
  const handlePaymentConfirmed = async (order: Order) => {
    if (!window.confirm("ステータスを「振込確認」に変更し、確認メールを送信しますか？")) {
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("振込確認メールを送信しています...");

    try {
      const paymentDate = new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const estimatedShippingDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // メール送信
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_confirmed",
          data: {
            to: order.customer.email,
            customerName: order.customer.name,
            orderNumber: order.orderNumber,
            paymentDate,
            total: order.total,
            estimatedShippingDate,
          },
        }),
      });

      // ステータス更新
      await handleOrderStatusUpdate(order.id, "confirmed");
    } catch (err) {
      console.error("振込確認処理エラー:", err);
      alert("処理に失敗しました");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  // 発送完了処理（メール送信 + ステータス更新）
  const handleShippingComplete = async (order: Order) => {
    const trackingNumber = window.prompt("追跡番号を入力してください:");
    if (!trackingNumber) {
      return;
    }

    const carrier = window.prompt("配送業者を入力してください（例: ヤマト運輸）:", "ヤマト運輸");
    if (!carrier) {
      return;
    }

    if (!window.confirm("ステータスを「発送完了」に変更し、発送完了メールを送信しますか？")) {
      return;
    }

    setIsProcessing(true);
    setProcessingMessage("発送完了メールを送信しています...");

    try {
      const shippingDate = new Date().toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const shippingAddress = `${order.customer.name} 様
〒${order.shippingAddress.zipCode}
${order.shippingAddress.prefecture}${order.shippingAddress.city}${order.shippingAddress.address}${order.shippingAddress.building ? `\n${order.shippingAddress.building}` : ""}`;

      // 追跡URLを生成（ヤマト運輸の例）
      let trackingUrl = "";
      if (carrier.includes("ヤマト")) {
        trackingUrl = `https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=${trackingNumber}`;
      } else if (carrier.includes("佐川")) {
        trackingUrl = `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${trackingNumber}`;
      } else if (carrier.includes("郵便") || carrier.includes("ゆうパック")) {
        trackingUrl = `https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=${trackingNumber}`;
      } else {
        trackingUrl = "配送業者のサイトで追跡番号をご確認ください";
      }

      // メール送信
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "shipping_complete",
          data: {
            to: order.customer.email,
            customerName: order.customer.name,
            orderNumber: order.orderNumber,
            shippingDate,
            carrier,
            trackingNumber,
            trackingUrl,
            shippingAddress,
          },
        }),
      });

      // ステータス更新
      await handleOrderStatusUpdate(order.id, "shipped");
    } catch (err) {
      console.error("発送完了処理エラー:", err);
      alert("処理に失敗しました");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <Header title="オンラインショップ管理" />
        <main className="p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </main>
      </div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout>
      <div className="min-h-screen bg-gray-50">
        <Header title="オンラインショップ管理" />
        <main className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">データがありません</h2>
              <p className="text-yellow-700 mb-4">{error}</p>
              <Link
                href="/seed"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                サンプルデータを投入する
              </Link>
            </div>
          </div>
        </main>
      </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
    <div className="min-h-screen bg-gray-50 relative">
      {/* 処理中オーバーレイ */}
      {isProcessing && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-gray-900 text-sm">{processingMessage}</p>
            <p className="text-gray-500 text-xs mt-1">しばらくお待ちください</p>
          </div>
        </div>
      )}

      <Header title="オンラインショップ管理" />

      <main className="p-8">
        {/* タブ */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("products")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              商品管理
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              注文管理
              {orderStats.pending > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {orderStats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("emails")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "emails"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              メール管理
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {emailTemplates.length}
              </span>
            </button>
          </nav>
        </div>

        {/* 商品管理タブ */}
        {activeTab === "products" && (
          <>
            {/* 商品一覧 */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">商品一覧</h2>
                  <select
                    value={productCategoryFilter}
                    onChange={(e) => handleCategoryFilterChange(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">すべてのカテゴリ</option>
                    <option value="supplement">サプリメント</option>
                    <option value="equipment">トレーニング器具</option>
                    <option value="wear">ウェア</option>
                    <option value="accessories">アクセサリー</option>
                    <option value="other">その他</option>
                  </select>
                  <span className="text-sm text-gray-500">
                    {totalProducts > 0
                      ? `${totalProducts}件中 ${startIndex + 1}-${Math.min(endIndex, totalProducts)}件を表示`
                      : "0件"}
                  </span>
                </div>
                <Link
                  href="/shop/products/new"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  商品登録
                </Link>
              </div>

              {/* 商品リスト（棒状レイアウト） */}
              {paginatedProducts.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  商品がありません
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/shop/products/${product.id}/edit`}
                      className={`px-6 py-4 flex items-center justify-between hover:bg-gray-100 cursor-pointer block ${
                        product.stock <= 5 ? "bg-red-50 hover:bg-red-100" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* 商品画像 */}
                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded relative overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                              IMG
                            </div>
                          )}
                        </div>

                        {/* 商品情報 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                            <span className="text-xs text-gray-400">ID: {product.id.slice(0, 8)}...</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              {categoryLabels[product.category]}
                            </span>
                            <span className="text-xs text-gray-500 truncate max-w-md">
                              {product.description}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 価格 */}
                      <div className="w-32 text-right">
                        <div className="font-bold text-gray-900">¥{product.price.toLocaleString()}</div>
                        {product.originalPrice && (
                          <div className="text-xs text-gray-400 line-through">
                            ¥{product.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* 在庫 */}
                      <div className="w-24 text-right">
                        <div className={`font-medium ${
                          product.stock === 0 ? "text-red-600" :
                          product.stock <= 5 ? "text-orange-600" : "text-gray-900"
                        }`}>
                          {product.stock}個
                        </div>
                        <div className="text-xs text-gray-500">在庫</div>
                      </div>

                      {/* ステータス */}
                      <div className="w-24 text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === "active" ? "bg-green-100 text-green-800" :
                          product.status === "inactive" ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800"
                        }`}>
                          {statusLabels[product.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    全 {totalProducts} 件中 {startIndex + 1} - {Math.min(endIndex, totalProducts)} 件を表示
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProductPage(p => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      前へ
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setProductPage(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            page === productPage
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setProductPage(p => Math.min(totalPages, p + 1))}
                      disabled={productPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 注文管理タブ */}
        {activeTab === "orders" && (
          <>
            {/* 注文サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">新規注文</div>
                <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">処理中</div>
                <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">発送済み</div>
                <div className="text-2xl font-bold text-purple-600">{orderStats.shipped}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">売上合計</div>
                <div className="text-2xl font-bold text-green-600">¥{orderStats.totalSales.toLocaleString()}</div>
              </div>
            </div>

            {/* フィルター */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">注文一覧</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">すべてのステータス</option>
                    <option value="pending">新規注文</option>
                    <option value="confirmed">確認済み</option>
                    <option value="processing">処理中</option>
                    <option value="shipped">発送済み</option>
                    <option value="delivered">配達完了</option>
                    <option value="cancelled">キャンセル</option>
                  </select>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                    CSVエクスポート
                  </button>
                </div>
              </div>
              {orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  注文がありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文日時</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注文番号</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧客情報</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支払い</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders
                        .filter(order => orderStatusFilter === "all" || order.status === orderStatusFilter)
                        .map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString("ja-JP")} {new Date(order.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                            <div className="text-xs text-gray-500">{order.customer.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {order.items.map((item, idx) => (
                                <div key={idx}>{item.productName} x{item.quantity}</div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">¥{order.total.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">税込</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block w-fit ${
                                order.paymentMethod === "credit_card" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                              }`}>
                                {order.paymentMethod === "credit_card" ? "クレジット" : order.paymentMethod === "bank_transfer" ? "銀行振込" : "コンビニ"}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-block w-fit ${
                                order.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                                order.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                              }`}>
                                {order.paymentStatus === "paid" ? "入金済" : order.paymentStatus === "pending" ? "未入金" : "失敗"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as Order["status"];
                                const statusLabelsMap: Record<Order["status"], string> = {
                                  pending: "新規注文",
                                  confirmed: "確認済み",
                                  processing: "処理中",
                                  shipped: "発送済み",
                                  delivered: "配達完了",
                                  cancelled: "キャンセル",
                                };
                                if (window.confirm(`ステータスを「${statusLabelsMap[newStatus]}」に変更しますか？`)) {
                                  handleOrderStatusUpdate(order.id, newStatus);
                                } else {
                                  e.target.value = order.status;
                                }
                              }}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer appearance-none ${
                                order.status === "delivered" ? "bg-green-100 text-green-800" :
                                order.status === "shipped" ? "bg-purple-100 text-purple-800" :
                                order.status === "processing" ? "bg-blue-100 text-blue-800" :
                                order.status === "confirmed" ? "bg-cyan-100 text-cyan-800" :
                                order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}
                            >
                              <option value="pending">新規注文</option>
                              <option value="confirmed">確認済み</option>
                              <option value="processing">処理中</option>
                              <option value="shipped">発送済み</option>
                              <option value="delivered">配達完了</option>
                              <option value="cancelled">キャンセル</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => { setSelectedOrder(order); setShowOrderDetailModal(true); }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                詳細
                              </button>
                              {order.status === "pending" && (
                                <button
                                  onClick={() => handlePaymentConfirmed(order)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  振込確認
                                </button>
                              )}
                              {(order.status === "confirmed" || order.status === "processing") && (
                                <button
                                  onClick={() => handleShippingComplete(order)}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  発送完了
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* メール管理タブ */}
        {activeTab === "emails" && (
          <>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">メールテンプレート管理</h2>
                  <p className="text-sm text-gray-500 mt-1">注文の各段階で送信されるメールのテンプレートを管理します</p>
                </div>
              </div>

              {emailTemplates.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">メールテンプレートがありません</h3>
                  <p className="mt-1 text-sm text-gray-500">「初期テンプレートを作成」ボタンをクリックして、デフォルトのテンプレートを作成してください。</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setSelectedTemplate(template); setShowEmailEditModal(true); }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">{templateTypeLabels[template.type]}</h3>
                              <p className="text-sm text-gray-500">{templateTypeDescriptions[template.type]}</p>
                            </div>
                          </div>
                          <div className="mt-2 ml-13">
                            <p className="text-sm text-gray-600 truncate">
                              <span className="font-medium">件名:</span> {template.subject}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">最終更新</p>
                            <p className="text-sm text-gray-600">
                              {new Date(template.updatedAt).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </main>

      {/* 注文詳細モーダル */}
      {showOrderDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => { setShowOrderDetailModal(false); setSelectedOrder(null); }}
          onStatusUpdate={handleOrderStatusUpdate}
        />
      )}

      {/* メールテンプレート編集モーダル */}
      {showEmailEditModal && selectedTemplate && (
        <EmailTemplateEditModal
          template={selectedTemplate}
          onClose={() => { setShowEmailEditModal(false); setSelectedTemplate(null); }}
          onSave={handleEmailTemplateUpdate}
        />
      )}
    </div>
    </ProtectedLayout>
  );
}

// 注文詳細モーダル
function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: Order["status"]) => Promise<void>;
}) {
  const [status, setStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    await onStatusUpdate(order.id, status);
    setIsUpdating(false);
    onClose();
  };

  const getStatusOptions = () => {
    return [
      { value: "pending", label: "新規注文" },
      { value: "confirmed", label: "確認済み" },
      { value: "processing", label: "処理中" },
      { value: "shipped", label: "発送済み" },
      { value: "delivered", label: "配達完了" },
      { value: "cancelled", label: "キャンセル" },
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">注文詳細</h2>
              <p className="text-sm text-gray-500">{order.orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ステータス更新 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">注文ステータス</h3>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                  order.status === "shipped" ? "bg-purple-100 text-purple-800" :
                  order.status === "processing" ? "bg-blue-100 text-blue-800" :
                  order.status === "confirmed" ? "bg-cyan-100 text-cyan-800" :
                  order.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {order.status === "delivered" ? "配達完了" :
                   order.status === "shipped" ? "発送済み" :
                   order.status === "processing" ? "処理中" :
                   order.status === "confirmed" ? "確認済み" :
                   order.status === "pending" ? "新規注文" : "キャンセル"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order["status"])}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getStatusOptions().map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {isUpdating ? "更新中..." : "更新"}
                </button>
              </div>
            </div>
          </div>

          {/* 顧客情報 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">顧客情報</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">氏名</p>
                  <p className="font-medium text-gray-900">{order.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">メールアドレス</p>
                  <p className="font-medium text-gray-900">{order.customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">電話番号</p>
                  <p className="font-medium text-gray-900">{order.customer.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 配送先 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">配送先</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-gray-900">
                〒{order.shippingAddress.zipCode}<br />
                {order.shippingAddress.prefecture}{order.shippingAddress.city}{order.shippingAddress.address}
                {order.shippingAddress.building && <><br />{order.shippingAddress.building}</>}
              </p>
            </div>
          </div>

          {/* 注文商品 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">注文商品</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品名</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">単価</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">数量</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">小計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">¥{item.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">¥{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 金額明細 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">金額明細</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">小計</span>
                  <span className="text-gray-900">¥{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">消費税（10%）</span>
                  <span className="text-gray-900">¥{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">送料</span>
                  <span className="text-gray-900">{order.shipping === 0 ? "無料" : `¥${order.shipping.toLocaleString()}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">合計（税込）</span>
                    <span className="font-bold text-xl text-blue-600">¥{order.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 支払い情報 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">支払い情報</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">支払い方法</p>
                  <p className="font-medium text-gray-900">
                    {order.paymentMethod === "credit_card" ? "クレジットカード" :
                     order.paymentMethod === "bank_transfer" ? "銀行振込" : "コンビニ払い"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">入金状況</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                    order.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  }`}>
                    {order.paymentStatus === "paid" ? "入金済み" : order.paymentStatus === "pending" ? "未入金" : "失敗"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 注文日時 */}
          <div className="text-sm text-gray-500">
            <p>注文日時: {new Date(order.createdAt).toLocaleString("ja-JP")}</p>
            <p>最終更新: {new Date(order.updatedAt).toLocaleString("ja-JP")}</p>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              閉じる
            </button>
            <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              納品書印刷
            </button>
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <button
                onClick={() => onStatusUpdate(order.id, "cancelled")}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                キャンセル
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// メールテンプレート編集モーダル
function EmailTemplateEditModal({
  template,
  onClose,
  onSave
}: {
  template: EmailTemplate;
  onClose: () => void;
  onSave: (type: EmailTemplateType, subject: string, body: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(template.type, subject, body);
    setIsSaving(false);
  };

  // プレビュー用のサンプルデータで置換
  const getPreviewBody = () => {
    return body
      .replace(/\{\{customer_name\}\}/g, "山田 太郎")
      .replace(/\{\{order_number\}\}/g, "ORD-20241126-1234")
      .replace(/\{\{order_date\}\}/g, "2024年11月26日 14:30")
      .replace(/\{\{order_items\}\}/g, "・プロテイン 1kg x 1 - ¥3,980\n・BCAAサプリメント x 2 - ¥5,960")
      .replace(/\{\{subtotal\}\}/g, "9,940")
      .replace(/\{\{tax\}\}/g, "994")
      .replace(/\{\{shipping\}\}/g, "0（無料）")
      .replace(/\{\{total\}\}/g, "10,934")
      .replace(/\{\{shipping_address\}\}/g, "〒150-0001\n東京都渋谷区神宮前1-2-3\nマンション101号室")
      .replace(/\{\{bank_name\}\}/g, "筋肉銀行")
      .replace(/\{\{branch_name\}\}/g, "マッスル支店（123）")
      .replace(/\{\{account_type\}\}/g, "普通")
      .replace(/\{\{account_number\}\}/g, "1234567")
      .replace(/\{\{account_holder\}\}/g, "カ）キンニクショップ")
      .replace(/\{\{payment_deadline\}\}/g, "2024年12月3日")
      .replace(/\{\{payment_date\}\}/g, "2024年11月27日")
      .replace(/\{\{estimated_shipping_date\}\}/g, "2024年11月29日")
      .replace(/\{\{shipping_date\}\}/g, "2024年11月29日")
      .replace(/\{\{carrier\}\}/g, "ヤマト運輸")
      .replace(/\{\{tracking_number\}\}/g, "1234-5678-9012")
      .replace(/\{\{tracking_url\}\}/g, "https://example.com/tracking/1234-5678-9012");
  };

  const getPreviewSubject = () => {
    return subject
      .replace(/\{\{customer_name\}\}/g, "山田 太郎")
      .replace(/\{\{order_number\}\}/g, "ORD-20241126-1234");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">メールテンプレート編集</h2>
              <p className="text-sm text-gray-500">{templateTypeLabels[template.type]}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 表示切り替えタブ */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 text-sm font-medium ${
                !showPreview
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              編集
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 text-sm font-medium ${
                showPreview
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              プレビュー
            </button>
          </div>

          {!showPreview ? (
            <>
              {/* 件名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  件名
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              {/* 本文 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  本文
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-gray-900 bg-white"
                />
              </div>

              {/* 使用可能な変数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  使用可能な変数
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableVariables[template.type].map((variable) => (
                    <button
                      key={variable}
                      onClick={() => {
                        navigator.clipboard.writeText(variable);
                      }}
                      className="px-2 py-1 bg-gray-200 text-gray-900 text-xs rounded hover:bg-gray-300"
                      title="クリックしてコピー"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">クリックするとコピーされます</p>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">件名:</span>
                <p className="text-gray-900 font-medium">{getPreviewSubject()}</p>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <span className="text-sm font-medium text-gray-500">本文:</span>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-900 font-sans">
                  {getPreviewBody()}
                </pre>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
