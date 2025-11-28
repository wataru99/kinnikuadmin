"use client";

import Header from "@/components/Header";
import ProtectedLayout from "@/components/ProtectedLayout";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { createProduct } from "@/lib/services/productService";
import { uploadProductImages, MAX_IMAGES } from "@/lib/services/storageService";
import type { Product } from "@/lib/types";

export default function ProductNewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    longDescription: "",
    price: "",
    originalPrice: "",
    stock: "",
    category: "supplement" as Product["category"],
    status: "active" as Product["status"],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalCount = selectedFiles.length + files.length;
    if (totalCount > MAX_IMAGES) {
      setError(`画像は最大${MAX_IMAGES}枚までです`);
      return;
    }

    // プレビュー用URL生成
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setSelectedFiles([...selectedFiles, ...files]);
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 商品を作成（画像なしで一旦作成）
      const productId = await createProduct({
        name: formData.name,
        description: formData.description,
        longDescription: formData.longDescription || undefined,
        price: parseInt(formData.price),
        originalPrice: formData.originalPrice ? parseInt(formData.originalPrice) : undefined,
        stock: parseInt(formData.stock),
        category: formData.category,
        status: formData.status,
      });

      // 画像がある場合はアップロード
      if (selectedFiles.length > 0) {
        const { updateProduct } = await import("@/lib/services/productService");
        const imageUrls = await uploadProductImages(selectedFiles, productId);
        await updateProduct(productId, { images: imageUrls });
      }

      router.push("/shop");
    } catch (err) {
      console.error("商品登録エラー:", err);
      setError(err instanceof Error ? err.message : "商品の登録に失敗しました。もう一度お試しください。");
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedLayout>
    <div className="min-h-screen bg-gray-50">
      <Header title="商品登録" />

      <main className="p-8">
        {/* パンくずリスト */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/shop" className="text-blue-600 hover:text-blue-800">
                オンラインショップ管理
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-600">商品登録</li>
          </ol>
        </nav>

        <div className="max-w-4xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {/* 基本情報 */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>

                <div className="space-y-6">
                  {/* 商品名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商品名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="例: プロテイン プレミアム ホエイ"
                    />
                  </div>

                  {/* 商品説明 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商品説明 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="商品の説明を入力してください"
                    />
                  </div>

                  {/* 商品内容 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      商品内容
                    </label>
                    <textarea
                      value={formData.longDescription}
                      onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="商品の詳細な内容を入力してください"
                    />
                  </div>

                  {/* カテゴリ */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      カテゴリ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Product["category"] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="supplement">サプリメント</option>
                      <option value="equipment">トレーニング器具</option>
                      <option value="wear">ウェア</option>
                      <option value="accessories">アクセサリー</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 価格・在庫 */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">価格・在庫</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 販売価格 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      販売価格（税込） <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="5980"
                      />
                    </div>
                  </div>

                  {/* 元価格（オプション） */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      元価格（税込・セール表示用）
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                      <input
                        type="number"
                        min="0"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="6980"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">セール価格を表示する場合に設定してください</p>
                  </div>

                  {/* 在庫数 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      在庫数 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">個</span>
                    </div>
                  </div>

                  {/* ステータス */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      販売ステータス <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Product["status"] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="active">販売中</option>
                      <option value="inactive">非公開</option>
                      <option value="out_of_stock">在庫切れ</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 商品画像 */}
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">商品画像</h2>
                <p className="text-sm text-gray-500 mb-4">最大{MAX_IMAGES}枚まで登録できます（{selectedFiles.length}/{MAX_IMAGES}）</p>

                {/* プレビュー */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                        <Image
                          src={url}
                          alt={`プレビュー ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                            メイン
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* アップロードエリア */}
                {selectedFiles.length < MAX_IMAGES && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="text-gray-400 mb-2">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">クリックまたはドラッグ＆ドロップで画像をアップロード</p>
                    <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WebP（最大10MB）</p>
                  </div>
                )}
              </div>

              {/* ボタン */}
              <div className="p-6 bg-gray-50 flex items-center justify-between">
                <Link
                  href="/shop"
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "登録中..." : "商品を登録する"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
    </ProtectedLayout>
  );
}
