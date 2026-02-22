"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DummyUser,
  UserTraining,
  TrainingExercise,
  MuscleGroup,
  muscleGroupLabels,
  CreateUserTrainingData,
  UpdateUserTrainingData,
} from "@/lib/types/dummyUser";
import {
  getUserTrainings,
  createUserTraining,
  updateUserTraining,
  deleteUserTraining,
} from "@/lib/services/dummyUserService";
import HumanBodyEditor, {
  defaultMusclePositions,
  defaultImagePosition,
} from "./HumanBodyEditor";

interface Props {
  users: DummyUser[];
}

const emptyExercise: TrainingExercise = {
  id: "",
  name: "",
  sets: 3,
  reps: "10",
  weight: "",
  notes: "",
};

export default function MyTrainingTab({ users }: Props) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [trainings, setTrainings] = useState<UserTraining[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // 編集対象（null = 新規作成モード）
  const [editingTraining, setEditingTraining] = useState<UserTraining | null>(null);

  // フォーム
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("chest");
  const [customMuscleNames, setCustomMuscleNames] = useState("");
  const [trainingMenu, setTrainingMenu] = useState("");
  const [trainingDetails, setTrainingDetails] = useState("");
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [exercises, setExercises] = useState<TrainingExercise[]>([
    { ...emptyExercise, id: crypto.randomUUID() },
  ]);
  const [musclePosition, setMusclePosition] = useState(defaultMusclePositions.chest);
  const [imagePosition, setImagePosition] = useState(defaultImagePosition);

  const isEditMode = editingTraining !== null;

  // 画像プレビューURL（新規ファイル > 既存URL）
  const imagePreviewUrl = useMemo(() => {
    if (customImageFile) return URL.createObjectURL(customImageFile);
    if (existingImageUrl) return existingImageUrl;
    return null;
  }, [customImageFile, existingImageUrl]);

  // プレビューURL cleanup（blobのみ）
  useEffect(() => {
    if (!customImageFile) return;
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [customImageFile, imagePreviewUrl]);

  useEffect(() => {
    if (selectedUserId) {
      fetchTrainings();
    } else {
      setTrainings([]);
    }
  }, [selectedUserId]);

  const fetchTrainings = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const data = await getUserTrainings(selectedUserId);
      setTrainings(data);
    } catch (e) {
      console.error("Error fetching trainings:", e);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMuscleGroup("chest");
    setCustomMuscleNames("");
    setTrainingMenu("");
    setTrainingDetails("");
    setCustomImageFile(null);
    setExistingImageUrl(null);
    setExercises([{ ...emptyExercise, id: crypto.randomUUID() }]);
    setMusclePosition(defaultMusclePositions.chest);
    setImagePosition(defaultImagePosition);
    setEditingTraining(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (training: UserTraining) => {
    setEditingTraining(training);
    setMuscleGroup(training.muscleGroup);
    setCustomMuscleNames(training.customMuscleNames?.join(", ") || "");
    setTrainingMenu(training.trainingMenu || "");
    setTrainingDetails(training.trainingDetails || "");
    setCustomImageFile(null);
    setExistingImageUrl(training.customImagePath || null);
    setExercises(
      training.exercises.length > 0
        ? training.exercises.map((ex) => ({
            ...ex,
            id: ex.id || crypto.randomUUID(),
          }))
        : [{ ...emptyExercise, id: crypto.randomUUID() }]
    );
    setMusclePosition({
      x: training.customMusclePositionX ?? defaultMusclePositions[training.muscleGroup].x,
      y: training.customMusclePositionY ?? defaultMusclePositions[training.muscleGroup].y,
    });
    setImagePosition({
      x: training.customImagePositionX ?? defaultImagePosition.x,
      y: training.customImagePositionY ?? defaultImagePosition.y,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      alert("エクササイズを1つ以上入力してください");
      return;
    }
    setSaving(true);
    try {
      if (isEditMode) {
        const data: UpdateUserTrainingData = {
          userId: selectedUserId,
          trainingId: editingTraining.id,
          muscleGroup,
          exercises: validExercises,
          trainingMenu: trainingMenu || null,
          trainingDetails: trainingDetails || null,
          customMuscleNames: customMuscleNames
            ? customMuscleNames.split(",").map((s) => s.trim()).filter(Boolean)
            : null,
          customImageFile: customImageFile || undefined,
          customMusclePositionX: musclePosition.x,
          customMusclePositionY: musclePosition.y,
          customImagePositionX: imagePosition.x,
          customImagePositionY: imagePosition.y,
        };
        await updateUserTraining(data);
        alert("トレーニングを更新しました");
      } else {
        const data: CreateUserTrainingData = {
          userId: selectedUserId,
          muscleGroup,
          exercises: validExercises,
          trainingMenu: trainingMenu || undefined,
          trainingDetails: trainingDetails || undefined,
          customImageFile: customImageFile || undefined,
          customMuscleNames: customMuscleNames
            ? customMuscleNames.split(",").map((s) => s.trim()).filter(Boolean)
            : undefined,
          customMusclePositionX: musclePosition.x,
          customMusclePositionY: musclePosition.y,
          customImagePositionX: imagePosition.x,
          customImagePositionY: imagePosition.y,
        };
        await createUserTraining(data);
        alert("トレーニングを作成しました");
      }
      setShowModal(false);
      resetForm();
      fetchTrainings();
    } catch (e) {
      alert(`${isEditMode ? "更新" : "作成"}に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (training: UserTraining) => {
    if (!confirm("このトレーニングを削除しますか？")) return;
    try {
      await deleteUserTraining(selectedUserId, training.id);
      fetchTrainings();
    } catch (e) {
      alert(`削除に失敗しました: ${e instanceof Error ? e.message : "不明なエラー"}`);
    }
  };

  const addExercise = () => {
    setExercises([...exercises, { ...emptyExercise, id: crypto.randomUUID() }]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof TrainingExercise, value: string | number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const formatDate = (epoch: number) => {
    return new Date(epoch * 1000).toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const selectedUserName = users.find((u) => u.id === selectedUserId)?.displayName || "";

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ユーザー選択 */}
      <div className="bg-white shadow rounded-lg p-3 lg:p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">ダミーユーザーを選択</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
        >
          <option value="">-- 選択 --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
      </div>

      {selectedUserId && (
        <>
          {/* 作成ボタン */}
          <button
            onClick={openCreateModal}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            + ホットスポット / トレーニング作成
          </button>

          {/* トレーニング一覧 */}
          <div className="bg-white shadow rounded-lg p-4 lg:p-6">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">
              {selectedUserName} のトレーニング一覧
            </h3>

            {loading ? (
              <div className="p-8 text-center text-gray-500">読み込み中...</div>
            ) : trainings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">トレーニングがありません</div>
            ) : (
              <div className="space-y-3">
                {trainings.map((training) => (
                  <div
                    key={training.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {muscleGroupLabels[training.muscleGroup] || training.muscleGroup}
                          </span>
                          {training.customMuscleNames?.map((name, i) => (
                            <span key={i} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                              {name}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400">{formatDate(training.lastUpdated)}</span>
                        </div>

                        {training.trainingMenu && (
                          <p className="text-sm text-gray-700 mt-1">{training.trainingMenu}</p>
                        )}
                      </div>

                      {training.customImagePath && (
                        <img
                          src={training.customImagePath}
                          alt="ホットスポット"
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                    </div>

                    {/* エクササイズ */}
                    {training.exercises.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {training.exercises.map((ex, i) => (
                          <div key={ex.id || i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5">
                            <span className="font-medium text-gray-900">{ex.name}</span>
                            <span>{ex.sets}セット</span>
                            <span>{ex.reps}回</span>
                            {ex.weight && <span>{ex.weight}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {training.trainingDetails && (
                      <p className="text-xs text-gray-500 mt-2 break-words">{training.trainingDetails}</p>
                    )}

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-400 font-mono truncate">{training.id}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(training)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(training)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 作成 / 編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {isEditMode ? "トレーニング編集" : "トレーニング作成"}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 部位 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部位 *</label>
                <select
                  value={muscleGroup}
                  onChange={(e) => {
                    const newGroup = e.target.value as MuscleGroup;
                    setMuscleGroup(newGroup);
                    if (!isEditMode) {
                      setMusclePosition(defaultMusclePositions[newGroup]);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {(Object.entries(muscleGroupLabels) as [MuscleGroup, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* カスタム筋肉名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カスタム筋肉名（カンマ区切り）</label>
                <input
                  type="text"
                  value={customMuscleNames}
                  onChange={(e) => setCustomMuscleNames(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="例: 大胸筋上部, 三角筋前部"
                />
              </div>

              {/* ホットスポット画像 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ホットスポット画像
                  {isEditMode && existingImageUrl && !customImageFile && (
                    <span className="text-xs text-gray-400 ml-2">（変更する場合のみ選択）</span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-900 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* 人体モデル＋ホットスポットエディタ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ホットスポット位置</label>
                <HumanBodyEditor
                  muscleGroup={muscleGroup}
                  musclePosition={musclePosition}
                  imagePosition={imagePosition}
                  onMusclePositionChange={setMusclePosition}
                  onImagePositionChange={setImagePosition}
                  imagePreviewUrl={imagePreviewUrl}
                  muscleName={
                    customMuscleNames
                      ? customMuscleNames.split(",")[0]?.trim()
                      : undefined
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  位置: ({musclePosition.x}, {musclePosition.y})
                  {imagePreviewUrl && ` / 画像: (${imagePosition.x}, ${imagePosition.y})`}
                </p>
              </div>

              {/* メニュー */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">トレーニングメニュー</label>
                <input
                  type="text"
                  value={trainingMenu}
                  onChange={(e) => setTrainingMenu(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="例: ベンチプレス 10回 × 3セット"
                />
              </div>

              {/* エクササイズ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">エクササイズ *</label>
                  <button
                    onClick={addExercise}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + 追加
                  </button>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex, idx) => (
                    <div key={ex.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                        {exercises.length > 1 && (
                          <button
                            onClick={() => removeExercise(ex.id)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            削除
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateExercise(ex.id, "name", e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500"
                        placeholder="種目名（例: ベンチプレス）"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">セット</label>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => updateExercise(ex.id, "sets", Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                            min={1}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">回数</label>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) => updateExercise(ex.id, "reps", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-0.5">重量</label>
                          <input
                            type="text"
                            value={ex.weight || ""}
                            onChange={(e) => updateExercise(ex.id, "weight", e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
                            placeholder="80kg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 詳細メモ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">詳細メモ</label>
                <textarea
                  value={trainingDetails}
                  onChange={(e) => setTrainingDetails(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 text-base"
                  rows={3}
                  placeholder="フォームのコツ、注意点など"
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-2 pb-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving || exercises.every((ex) => !ex.name.trim())}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving
                    ? (isEditMode ? "更新中..." : "作成中...")
                    : isEditMode
                      ? "トレーニングを更新"
                      : `${selectedUserName} のトレーニングを作成`
                  }
                </button>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
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
