"use client";

import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, Timestamp, updateDoc, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

type AnnouncementCategory = "important" | "update" | "event" | "maintenance" | "general";

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isActive: boolean;
  priority: number;
  targetUserRole: string;
  imageURLs?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("topics");

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="サービス管理" />

      <main className="p-8">
        {/* タブナビゲーション */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <TabButton
              active={activeTab === "topics"}
              onClick={() => setActiveTab("topics")}
              label="トピック投稿"
            />
            <TabButton
              active={activeTab === "announcements"}
              onClick={() => setActiveTab("announcements")}
              label="お知らせ投稿"
            />
            <TabButton
              active={activeTab === "gyms"}
              onClick={() => setActiveTab("gyms")}
              label="ジム管理"
            />
            <TabButton
              active={activeTab === "trainers"}
              onClick={() => setActiveTab("trainers")}
              label="パーソナルトレーナー"
            />
            <TabButton
              active={activeTab === "fanclub"}
              onClick={() => setActiveTab("fanclub")}
              label="ファンクラブ"
            />
            <TabButton
              active={activeTab === "challenge"}
              onClick={() => setActiveTab("challenge")}
              label="筋肉チャレンジ"
            />
          </nav>
        </div>

        {/* コンテンツエリア */}
        <div>
          {activeTab === "topics" && <TopicsSection />}
          {activeTab === "announcements" && <AnnouncementsSection />}
          {activeTab === "gyms" && <GymsSection />}
          {activeTab === "trainers" && <TrainersSection />}
          {activeTab === "fanclub" && <FanClubSection />}
          {activeTab === "challenge" && <ChallengeSection />}
        </div>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        active
          ? "border-blue-500 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

type TopicCategory = "training" | "nutrition" | "supplement" | "news";

interface Topic {
  id: string;
  title: string;
  content: string;
  imageURL?: string;
  category: TopicCategory;
  author: string;
  publishedAt?: Date;
  likes?: number;
  comments?: number;
  isNew?: boolean;
}

function TopicsSection() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "training" as TopicCategory,
    author: "管理者",
    isNew: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const q = query(collection(db, "topics"), orderBy("publishedAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      const topicsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          publishedAt: data.publishedAt?.toDate(),
        } as Topic;
      });
      setTopics(topicsData);
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!selectedImage) return undefined;

    try {
      console.log("Uploading image:", selectedImage.name);
      const imageRef = ref(storage, `topics/${Date.now()}_${selectedImage.name}`);
      await uploadBytes(imageRef, selectedImage);
      const url = await getDownloadURL(imageRef);
      console.log("Image uploaded successfully:", url);
      return url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageURL: string | undefined;
      if (selectedImage) {
        imageURL = await uploadImage();
      }

      if (editingTopic) {
        // 編集モード
        await updateDoc(doc(db, "topics", editingTopic.id), {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          author: formData.author,
          isNew: formData.isNew,
          ...(imageURL && { imageURL }),
        });
      } else {
        // 新規作成モード
        await addDoc(collection(db, "topics"), {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          author: formData.author,
          imageURL: imageURL || "",
          publishedAt: Timestamp.now(),
          likes: 0,
          comments: 0,
          isNew: formData.isNew,
        });
      }

      setShowModal(false);
      setEditingTopic(null);
      setFormData({
        title: "",
        content: "",
        category: "training",
        author: "管理者",
        isNew: false,
      });
      setSelectedImage(null);
      fetchTopics();
    } catch (error) {
      console.error("Error saving topic:", error);
      alert(editingTopic ? "トピックの更新に失敗しました" : "トピックの作成に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      title: topic.title,
      content: topic.content,
      category: topic.category,
      author: topic.author,
      isNew: topic.isNew || false,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTopic(null);
    setFormData({
      title: "",
      content: "",
      category: "training",
      author: "管理者",
      isNew: false,
    });
    setSelectedImage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このトピックを削除しますか？")) return;

    try {
      await deleteDoc(doc(db, "topics", id));
      fetchTopics();
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("削除に失敗しました");
    }
  };

  const getCategoryLabel = (category: TopicCategory) => {
    const labels = {
      training: "トレーニング",
      nutrition: "栄養・食事",
      supplement: "サプリ",
      news: "ニュース",
    };
    return labels[category];
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">トピック投稿管理</h2>
          <p className="text-sm text-gray-600 mt-1">筋トレに関する情報記事を管理</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          新規トピック作成
        </button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gray-50">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">総トピック数</div>
          <div className="text-2xl font-bold text-gray-900">{topics.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">NEW付きトピック</div>
          <div className="text-2xl font-bold text-gray-900">{topics.filter(t => t.isNew).length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">総いいね数</div>
          <div className="text-2xl font-bold text-gray-900">{topics.reduce((sum, t) => sum + (t.likes || 0), 0)}</div>
        </div>
      </div>

      {/* トピック一覧 */}
      {loading ? (
        <div className="p-8 text-center text-gray-600">読み込み中...</div>
      ) : topics.length === 0 ? (
        <div className="p-8 text-center text-gray-600">トピックがありません</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">画像</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">投稿者</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公開日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">いいね</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topics.map((topic) => (
                <tr
                  key={topic.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEdit(topic)}
                >
                  <td className="px-6 py-4">
                    {topic.imageURL ? (
                      <img
                        src={topic.imageURL}
                        alt={topic.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{topic.title}</div>
                      {topic.isNew && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                          NEW
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {getCategoryLabel(topic.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{topic.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {topic.publishedAt?.toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{topic.likes || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(topic.id); }}
                      className="text-red-600 hover:text-red-900"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 作成・編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTopic ? "トピックを編集" : "新規トピック作成"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as TopicCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="training">トレーニング</option>
                  <option value="nutrition">栄養・食事</option>
                  <option value="supplement">サプリ</option>
                  <option value="news">ニュース</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投稿者</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">画像（1枚）</label>
                {/* 編集時に現在の画像を表示 */}
                {editingTopic?.imageURL && !selectedImage && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">現在の画像:</p>
                    <img
                      src={editingTopic.imageURL}
                      alt="現在の画像"
                      className="w-32 h-32 object-cover rounded border border-gray-300"
                    />
                  </div>
                )}
                {/* 選択した新しい画像のプレビュー */}
                {selectedImage && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">新しい画像:</p>
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="新しい画像プレビュー"
                      className="w-32 h-32 object-cover rounded border border-gray-300"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isNew"
                  checked={formData.isNew}
                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isNew" className="text-sm text-gray-700">
                  NEWバッジを表示
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? (editingTopic ? "更新中..." : "作成中...") : (editingTopic ? "更新" : "作成")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general" as AnnouncementCategory,
    isActive: true,
    priority: 5,
    targetUserRole: "all",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsRef = collection(db, "announcements");
      const q = query(announcementsRef, orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await getDocs(q);

      const fetchedAnnouncements: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedAnnouncements.push({
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          category: data.category || "general",
          isActive: data.isActive ?? true,
          priority: data.priority || 5,
          targetUserRole: data.targetUserRole || "all",
          imageURLs: data.imageURLs || [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
        });
      });

      setAnnouncements(fetchedAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      alert("お知らせの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 3);
      setSelectedImages(fileArray);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const imageURLs: string[] = [];
    for (const file of selectedImages) {
      const timestamp = Date.now();
      const fileName = `announcements/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      imageURLs.push(downloadURL);
    }
    return imageURLs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert("タイトルと内容を入力してください");
      return;
    }

    try {
      setUploading(true);
      const newImageURLs = selectedImages.length > 0 ? await uploadImages() : [];

      if (editingAnnouncement) {
        // 編集モード
        const updateData: Record<string, unknown> = {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          isActive: formData.isActive,
          priority: formData.priority,
          targetUserRole: formData.targetUserRole,
          updatedAt: Timestamp.now(),
        };
        // 新しい画像がある場合のみ更新
        if (newImageURLs.length > 0) {
          updateData.imageURLs = newImageURLs;
        }
        await updateDoc(doc(db, "announcements", editingAnnouncement.id), updateData);
        alert("お知らせを更新しました");
      } else {
        // 新規作成モード
        const announcementsRef = collection(db, "announcements");
        await addDoc(announcementsRef, {
          title: formData.title,
          content: formData.content,
          category: formData.category,
          isActive: formData.isActive,
          priority: formData.priority,
          targetUserRole: formData.targetUserRole,
          imageURLs: newImageURLs,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        alert("お知らせを作成しました");
      }

      setShowModal(false);
      setEditingAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert(editingAnnouncement ? "お知らせの更新に失敗しました" : "お知らせの作成に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isActive: announcement.isActive,
      priority: announcement.priority,
      targetUserRole: announcement.targetUserRole,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このお知らせを削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      alert("お知らせを削除しました");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("お知らせの削除に失敗しました");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "announcements", id), {
        isActive: !currentStatus,
        updatedAt: Timestamp.now(),
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error updating announcement:", error);
      alert("ステータスの更新に失敗しました");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "general",
      isActive: true,
      priority: 5,
      targetUserRole: "all",
    });
    setSelectedImages([]);
  };

  const getCategoryLabel = (category: AnnouncementCategory) => {
    switch (category) {
      case "important": return "重要";
      case "update": return "アップデート";
      case "event": return "イベント";
      case "maintenance": return "メンテナンス";
      default: return "一般";
    }
  };

  const getCategoryColor = (category: AnnouncementCategory) => {
    switch (category) {
      case "important": return "bg-red-100 text-red-800";
      case "update": return "bg-blue-100 text-blue-800";
      case "event": return "bg-purple-100 text-purple-800";
      case "maintenance": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">総お知らせ数</div>
          <div className="text-3xl font-bold text-gray-900">{announcements.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">公開中</div>
          <div className="text-3xl font-bold text-green-600">
            {announcements.filter(a => a.isActive).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">非公開</div>
          <div className="text-3xl font-bold text-gray-600">
            {announcements.filter(a => !a.isActive).length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">重要なお知らせ</div>
          <div className="text-3xl font-bold text-red-600">
            {announcements.filter(a => a.category === "important" || a.priority > 7).length}
          </div>
        </div>
      </div>

      {/* 新規作成ボタン */}
      <div className="mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-md"
        >
          + 新規お知らせ作成
        </button>
      </div>

      {/* お知らせ一覧 */}
      {loading ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEdit(announcement)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(announcement.category)}`}>
                      {getCategoryLabel(announcement.category)}
                    </span>
                    {announcement.priority > 7 && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        優先度: 高
                      </span>
                    )}
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      announcement.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {announcement.isActive ? "公開中" : "非公開"}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-3">{announcement.content}</p>

                  {announcement.imageURLs && announcement.imageURLs.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {announcement.imageURLs.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`お知らせ画像 ${index + 1}`}
                          className="w-32 h-32 object-cover rounded border border-gray-200"
                        />
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    作成: {formatDate(announcement.createdAt)} |
                    更新: {formatDate(announcement.updatedAt)} |
                    対象: {announcement.targetUserRole === "all" ? "全ユーザー" : announcement.targetUserRole} |
                    優先度: {announcement.priority}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleActive(announcement.id, announcement.isActive); }}
                    className={`px-4 py-2 rounded text-sm font-medium ${
                      announcement.isActive
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    {announcement.isActive ? "非公開にする" : "公開する"}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(announcement.id); }}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded text-sm font-medium hover:bg-red-200"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}

          {announcements.length === 0 && !loading && (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500">お知らせがありません</p>
            </div>
          )}
        </div>
      )}

      {/* 新規作成・編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAnnouncement ? "お知らせを編集" : "新規お知らせ作成"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AnnouncementCategory })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="general">一般</option>
                    <option value="important">重要</option>
                    <option value="update">アップデート</option>
                    <option value="event">イベント</option>
                    <option value="maintenance">メンテナンス</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    優先度 (1-10) - 高いほど上位表示
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">対象ユーザー</label>
                  <select
                    value={formData.targetUserRole}
                    onChange={(e) => setFormData({ ...formData, targetUserRole: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="all">全ユーザー</option>
                    <option value="viewer">一般ユーザー</option>
                    <option value="trainer">トレーナー</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    画像 (最大3枚)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  {selectedImages.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      選択中: {selectedImages.length}枚
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">作成後すぐに公開する</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400"
                  >
                    {uploading ? (editingAnnouncement ? "更新中..." : "作成中...") : (editingAnnouncement ? "更新" : "作成")}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GymsSection() {
  const mockGyms = [
    {
      id: "1",
      name: "ゴールドジム 新宿店",
      prefecture: "東京都",
      city: "新宿区",
      rating: 4.5,
      memberCount: 1250,
      verified: true,
      facilities: ["フリーウェイト", "マシン", "プール", "サウナ"],
    },
    {
      id: "2",
      name: "エニタイムフィットネス 渋谷店",
      prefecture: "東京都",
      city: "渋谷区",
      rating: 4.3,
      memberCount: 890,
      verified: true,
      facilities: ["24時間営業", "マシン", "フリーウェイト"],
    },
    {
      id: "3",
      name: "コナミスポーツクラブ 池袋",
      prefecture: "東京都",
      city: "豊島区",
      rating: 4.1,
      memberCount: 650,
      verified: false,
      facilities: ["プール", "スタジオ", "マシン"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ジム管理</h2>
            <p className="text-sm text-gray-600 mt-1">提携ジムの情報を管理</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            ジム追加
          </button>
        </div>

        {/* 検索・フィルター */}
        <div className="mt-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="ジム名で検索..."
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
            <option value="">すべての都道府県</option>
            <option value="tokyo">東京都</option>
            <option value="osaka">大阪府</option>
            <option value="kanagawa">神奈川県</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
            <option value="">すべて</option>
            <option value="verified">認証済みのみ</option>
          </select>
        </div>
      </div>

      {/* ジムカード一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockGyms.map((gym) => (
          <div key={gym.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{gym.name}</h3>
                  {gym.verified && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      認証済み
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {gym.prefecture} {gym.city}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-yellow-400 mb-1">
                  <span className="text-lg">★</span>
                  <span className="text-sm font-semibold text-gray-900">{gym.rating}</span>
                </div>
                <p className="text-xs text-gray-500">{gym.memberCount}人が利用</p>
              </div>
            </div>

            {/* 設備タグ */}
            <div className="flex flex-wrap gap-2 mb-4">
              {gym.facilities.map((facility, index) => (
                <span key={index} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  {facility}
                </span>
              ))}
            </div>

            {/* アクション */}
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                詳細・編集
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrainersSection() {
  const mockTrainers = [
    {
      id: "1",
      name: "山田 太郎",
      specialty: "ボディメイク",
      experience: 10,
      rating: 4.8,
      sessions: 450,
      price: 8000,
      certifications: ["NSCA-CPT", "JATI-ATI"],
      status: "active",
    },
    {
      id: "2",
      name: "佐藤 花子",
      specialty: "ダイエット指導",
      experience: 7,
      rating: 4.9,
      sessions: 380,
      price: 7000,
      certifications: ["NESTA-PFT", "栄養士"],
      status: "active",
    },
    {
      id: "3",
      name: "鈴木 一郎",
      specialty: "アスリート育成",
      experience: 15,
      rating: 4.7,
      sessions: 620,
      price: 12000,
      certifications: ["NSCA-CSCS", "JATI-AATI"],
      status: "inactive",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">パーソナルトレーナー管理</h2>
            <p className="text-sm text-gray-600 mt-1">登録トレーナーの情報を管理</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            トレーナー追加
          </button>
        </div>

        {/* 検索・フィルター */}
        <div className="mt-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="トレーナー名で検索..."
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
            <option value="">すべての専門分野</option>
            <option value="bodybuilding">ボディメイク</option>
            <option value="diet">ダイエット指導</option>
            <option value="athlete">アスリート育成</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
            <option value="">すべてのステータス</option>
            <option value="active">稼働中</option>
            <option value="inactive">休止中</option>
          </select>
        </div>
      </div>

      {/* トレーナーカード一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockTrainers.map((trainer) => (
          <div key={trainer.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* カードヘッダー */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl text-gray-400">
                  人
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    trainer.status === "active" ? "bg-green-400 text-white" : "bg-gray-400 text-white"
                  }`}
                >
                  {trainer.status === "active" ? "稼働中" : "休止中"}
                </span>
              </div>
              <h3 className="text-xl font-bold">{trainer.name}</h3>
              <p className="text-sm text-blue-100">{trainer.specialty}</p>
            </div>

            {/* カードボディ */}
            <div className="p-6">
              {/* 統計情報 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">経験年数</p>
                  <p className="text-lg font-semibold text-gray-900">{trainer.experience}年</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">評価</p>
                  <p className="text-lg font-semibold text-gray-900">★ {trainer.rating}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">セッション数</p>
                  <p className="text-lg font-semibold text-gray-900">{trainer.sessions}回</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">料金</p>
                  <p className="text-lg font-semibold text-blue-600">¥{trainer.price.toLocaleString()}/回</p>
                </div>
              </div>

              {/* 資格 */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">保有資格</p>
                <div className="flex flex-wrap gap-2">
                  {trainer.certifications.map((cert, index) => (
                    <span key={index} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* アクション */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  詳細・編集
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FanClubSection() {
  const mockMembers = [
    { tier: "ブロンズ", count: 1450, monthlyFee: 500, color: "orange" },
    { tier: "シルバー", count: 680, monthlyFee: 1000, color: "gray" },
    { tier: "ゴールド", count: 240, monthlyFee: 2000, color: "yellow" },
    { tier: "プラチナ", count: 85, monthlyFee: 5000, color: "blue" },
  ];

  const mockPosts = [
    {
      id: "1",
      title: "限定トレーニング動画 - 大胸筋編",
      tier: "シルバー以上",
      publishedAt: "2024-03-20",
      likes: 234,
    },
    {
      id: "2",
      title: "Q&Aライブ配信アーカイブ",
      tier: "ゴールド以上",
      publishedAt: "2024-03-18",
      likes: 156,
    },
    {
      id: "3",
      title: "オンラインセミナー: 栄養管理の基礎",
      tier: "プラチナ限定",
      publishedAt: "2024-03-15",
      likes: 89,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">ファンクラブ管理</h2>
        <p className="text-sm text-gray-600">有料会員向けコンテンツと収益を管理</p>
      </div>

      {/* 会員統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMembers.map((member) => (
          <div key={member.tier} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">{member.tier}</h3>
              <div
                className={`w-3 h-3 rounded-full ${
                  member.color === "orange"
                    ? "bg-orange-500"
                    : member.color === "gray"
                    ? "bg-gray-400"
                    : member.color === "yellow"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              ></div>
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{member.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500">会員</p>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">月額 ¥{member.monthlyFee.toLocaleString()}</p>
              <p className="text-lg font-semibold text-blue-600">
                ¥{(member.count * member.monthlyFee).toLocaleString()}/月
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 限定コンテンツ管理 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">限定コンテンツ</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
            新規コンテンツ作成
          </button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象ティア</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公開日</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">いいね</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">アクション</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {post.tier}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{post.publishedAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{post.likes}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">編集</button>
                  <button className="text-red-600 hover:text-red-900">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChallengeSection() {
  const mockChallenges = [
    {
      id: "1",
      title: "30日腕立て伏せチャレンジ",
      period: "2024-03-01 ~ 2024-03-31",
      participants: 856,
      completionRate: 68,
      status: "ongoing",
      prize: "限定バッジ",
    },
    {
      id: "2",
      title: "スクワット100回チャレンジ",
      period: "2024-03-15 ~ 2024-04-15",
      participants: 432,
      completionRate: 0,
      status: "upcoming",
      prize: "ポイント500pt",
    },
    {
      id: "3",
      title: "毎日プランク1分チャレンジ",
      period: "2024-02-01 ~ 2024-02-29",
      participants: 1024,
      completionRate: 72,
      status: "completed",
      prize: "限定称号",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">筋肉チャレンジ管理</h2>
            <p className="text-sm text-gray-600 mt-1">ユーザー参加型のトレーニングチャレンジを管理</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            新規チャレンジ作成
          </button>
        </div>

        {/* フィルター */}
        <div className="mt-6 flex flex-wrap gap-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900">
            <option value="">すべてのステータス</option>
            <option value="ongoing">開催中</option>
            <option value="upcoming">開催予定</option>
            <option value="completed">終了</option>
          </select>
        </div>
      </div>

      {/* チャレンジカード一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockChallenges.map((challenge) => (
          <div key={challenge.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {/* ステータスバー */}
            <div
              className={`h-2 ${
                challenge.status === "ongoing"
                  ? "bg-green-500"
                  : challenge.status === "upcoming"
                  ? "bg-blue-500"
                  : "bg-gray-400"
              }`}
            ></div>

            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{challenge.title}</h3>
                  <p className="text-sm text-gray-600">{challenge.period}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    challenge.status === "ongoing"
                      ? "bg-green-100 text-green-800"
                      : challenge.status === "upcoming"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {challenge.status === "ongoing" ? "開催中" : challenge.status === "upcoming" ? "開催予定" : "終了"}
                </span>
              </div>

              {/* 統計 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">参加者数</p>
                  <p className="text-2xl font-bold text-gray-900">{challenge.participants.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">達成率</p>
                  <p className="text-2xl font-bold text-blue-600">{challenge.completionRate}%</p>
                </div>
              </div>

              {/* 達成率プログレスバー */}
              {challenge.status !== "upcoming" && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${challenge.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 報酬 */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium mb-1">達成報酬</p>
                <p className="text-sm font-semibold text-yellow-900">{challenge.prize}</p>
              </div>

              {/* アクション */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  詳細・編集
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
