"use client";

export default function AutoOperationTab() {
  const mockSchedules = [
    { name: "毎日いいね巡回", type: "いいね", schedule: "毎日 9:00", enabled: false },
    { name: "週次投稿", type: "投稿", schedule: "毎週月曜 10:00", enabled: false },
    { name: "閲覧数ブースト", type: "閲覧数", schedule: "毎日 12:00", enabled: false },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Coming Soon バナー */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-6 lg:p-8 text-white text-center">
        <h2 className="text-xl lg:text-2xl font-bold mb-2">自動運用設定</h2>
        <p className="text-purple-100 text-sm lg:text-base mb-3">Coming Soon - この機能は今後実装予定です</p>
        <div className="inline-flex items-center px-3 py-1.5 bg-white/20 rounded-lg text-sm">
          開発中
        </div>
      </div>

      {/* モックUI: スケジュール一覧 */}
      <div className="bg-white shadow rounded-lg p-4 lg:p-6 opacity-60">
        <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">スケジュール設定</h3>
        <div className="space-y-2">
          {mockSchedules.map((schedule, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                <div className="text-xs text-gray-500">
                  <span className="mr-2">{schedule.type}</span>
                  <span>{schedule.schedule}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`w-10 h-5 rounded-full relative cursor-not-allowed ${
                  schedule.enabled ? "bg-blue-600" : "bg-gray-300"
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    schedule.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          disabled
          className="mt-3 w-full border-2 border-dashed border-gray-300 text-gray-400 px-4 py-2.5 rounded-lg cursor-not-allowed text-sm"
        >
          + 新しいスケジュールを追加
        </button>
      </div>

      {/* モックUI: アクション種別 */}
      <div className="bg-white shadow rounded-lg p-4 lg:p-6 opacity-60">
        <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">アクション種別</h3>
        <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-0.5">自動いいね</div>
            <p className="text-xs text-gray-500">リアルユーザーの投稿に自動でいいね</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-0.5">自動投稿</div>
            <p className="text-xs text-gray-500">テンプレートから自動で投稿を作成</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-0.5">閲覧数ブースト</div>
            <p className="text-xs text-gray-500">指定した投稿の閲覧数を定期的に増加</p>
          </div>
        </div>
      </div>
    </div>
  );
}
