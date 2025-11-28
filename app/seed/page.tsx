"use client";

import { useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";
import Link from "next/link";

type Product = {
  name: string;
  description: string;
  longDescription?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: "supplement" | "equipment" | "wear" | "accessories" | "other";
  status: "active" | "inactive" | "out_of_stock";
  image?: string;
  rating?: number;
  reviews?: number;
  details?: {
    content?: string;
    ingredients?: string;
    material?: string;
    size?: string;
    weight?: string;
    manufacturer?: string;
    origin?: string;
  };
};

// 120商品のデータ
const products: Product[] = [
  // サプリメント (40商品)
  { name: "プロテイン プレミアム ホエイ", description: "高品質なホエイプロテイン。筋肉の成長と回復をサポートします。", longDescription: "厳選されたホエイプロテインを使用し、1食あたり24gのタンパク質を摂取できます。", price: 4980, originalPrice: 5980, stock: 50, category: "supplement", status: "active", rating: 4.5, reviews: 128 },
  { name: "BCAA パウダー", description: "分岐鎖アミノ酸で筋肉疲労を軽減。トレーニング中の補給に最適。", price: 2980, stock: 35, category: "supplement", status: "active", rating: 4.3, reviews: 89 },
  { name: "クレアチン モノハイドレート", description: "瞬発力とパワーを向上させるクレアチンサプリメント。", price: 2480, stock: 0, category: "supplement", status: "out_of_stock", rating: 4.6, reviews: 156 },
  { name: "マルチビタミン", description: "必須ビタミンとミネラルを1粒で補給。健康維持に。", price: 1980, stock: 5, category: "supplement", status: "active", rating: 4.2, reviews: 67 },
  { name: "プレワークアウト エナジー", description: "トレーニング前の集中力とエネルギーをブースト。", price: 3480, stock: 28, category: "supplement", status: "active", rating: 4.4, reviews: 94 },
  { name: "カゼインプロテイン", description: "就寝前に最適なスローリリースプロテイン。", price: 4280, stock: 22, category: "supplement", status: "active", rating: 4.3, reviews: 78 },
  { name: "グルタミン パウダー", description: "免疫力と筋肉回復をサポートするアミノ酸。", price: 2680, stock: 45, category: "supplement", status: "active", rating: 4.1, reviews: 52 },
  { name: "EAAサプリメント", description: "必須アミノ酸9種類を配合。筋合成を促進。", price: 3280, stock: 18, category: "supplement", status: "active", rating: 4.5, reviews: 103 },
  { name: "HMBサプリメント", description: "筋肉分解を抑制し、筋力アップをサポート。", price: 3980, originalPrice: 4480, stock: 30, category: "supplement", status: "active", rating: 4.2, reviews: 61 },
  { name: "シトルリン マレート", description: "血流を促進し、パンプ感を向上。", price: 2180, stock: 40, category: "supplement", status: "active", rating: 4.0, reviews: 45 },
  { name: "オメガ3 フィッシュオイル", description: "EPA・DHAを高濃度配合。関節と心臓の健康に。", price: 2480, stock: 55, category: "supplement", status: "active", rating: 4.4, reviews: 112 },
  { name: "ビタミンD3", description: "筋力維持と骨の健康をサポート。", price: 1280, stock: 70, category: "supplement", status: "active", rating: 4.3, reviews: 87 },
  { name: "亜鉛サプリメント", description: "テストステロン産生と免疫機能をサポート。", price: 980, stock: 85, category: "supplement", status: "active", rating: 4.1, reviews: 56 },
  { name: "マグネシウム", description: "筋肉の収縮とリラックスをサポート。", price: 1180, stock: 60, category: "supplement", status: "active", rating: 4.2, reviews: 43 },
  { name: "アルギニン", description: "成長ホルモン分泌と血流を促進。", price: 1980, stock: 0, category: "supplement", status: "out_of_stock", rating: 4.0, reviews: 38 },
  { name: "カルニチン", description: "脂肪燃焼をサポートするアミノ酸。", price: 2280, stock: 42, category: "supplement", status: "active", rating: 4.1, reviews: 49 },
  { name: "コラーゲンペプチド", description: "関節と肌の健康をサポート。", price: 2880, stock: 33, category: "supplement", status: "active", rating: 4.5, reviews: 134 },
  { name: "ベータアラニン", description: "持久力とパフォーマンスを向上。", price: 1880, stock: 25, category: "supplement", status: "active", rating: 4.0, reviews: 32 },
  { name: "タウリン", description: "エネルギー代謝と心臓機能をサポート。", price: 1480, stock: 48, category: "supplement", status: "active", rating: 4.1, reviews: 41 },
  { name: "アシュワガンダ", description: "ストレス軽減とテストステロンサポート。", price: 2180, stock: 38, category: "supplement", status: "active", rating: 4.4, reviews: 76 },
  { name: "ソイプロテイン", description: "植物性タンパク質で乳製品不使用。", price: 3480, stock: 20, category: "supplement", status: "active", rating: 4.2, reviews: 58 },
  { name: "ピープロテイン", description: "エンドウ豆由来のプロテイン。アレルギー対応。", price: 3680, stock: 15, category: "supplement", status: "active", rating: 4.3, reviews: 42 },
  { name: "ウェイトゲイナー", description: "体重増加を目指す方に。高カロリープロテイン。", price: 5480, originalPrice: 5980, stock: 12, category: "supplement", status: "active", rating: 4.1, reviews: 35 },
  { name: "ダイエットプロテイン", description: "低カロリー・高タンパクのダイエットサポート。", price: 4180, stock: 28, category: "supplement", status: "active", rating: 4.4, reviews: 89 },
  { name: "プロテインバー チョコ味", description: "持ち運びに便利なプロテインバー。20g配合。", price: 298, stock: 200, category: "supplement", status: "active", rating: 4.2, reviews: 156 },
  { name: "プロテインバー バニラ味", description: "甘さ控えめのバニラフレーバー。", price: 298, stock: 180, category: "supplement", status: "active", rating: 4.1, reviews: 98 },
  { name: "MCTオイル", description: "ケトジェニックダイエットに最適。即エネルギー源。", price: 2480, stock: 35, category: "supplement", status: "active", rating: 4.3, reviews: 67 },
  { name: "CLA（共役リノール酸）", description: "脂肪代謝をサポートする不飽和脂肪酸。", price: 1980, stock: 40, category: "supplement", status: "active", rating: 4.0, reviews: 34 },
  { name: "テストステロンブースター", description: "自然なテストステロンレベルをサポート。", price: 4980, stock: 3, category: "supplement", status: "active", rating: 4.2, reviews: 48 },
  { name: "ジョイントサポート", description: "グルコサミン・コンドロイチン配合。関節の健康に。", price: 2880, stock: 25, category: "supplement", status: "active", rating: 4.5, reviews: 112 },
  { name: "睡眠サポートサプリ", description: "ZMAとメラトニン配合。回復力を高める睡眠を。", price: 2180, stock: 45, category: "supplement", status: "active", rating: 4.4, reviews: 78 },
  { name: "イントラワークアウト", description: "トレーニング中の栄養補給に最適なドリンク。", price: 3280, stock: 22, category: "supplement", status: "active", rating: 4.1, reviews: 43 },
  { name: "ポストワークアウト", description: "トレーニング後の回復を促進するブレンド。", price: 3480, stock: 18, category: "supplement", status: "active", rating: 4.3, reviews: 56 },
  { name: "エレクトロライト", description: "電解質補給で脱水を防止。汗をかくトレーニングに。", price: 1680, stock: 55, category: "supplement", status: "active", rating: 4.2, reviews: 65 },
  { name: "ホエイアイソレート", description: "高純度のホエイプロテイン。脂質・糖質カット。", price: 5980, originalPrice: 6480, stock: 30, category: "supplement", status: "active", rating: 4.6, reviews: 145 },
  { name: "プロバイオティクス", description: "腸内環境を整える乳酸菌サプリ。", price: 1980, stock: 42, category: "supplement", status: "active", rating: 4.3, reviews: 87 },
  { name: "消化酵素", description: "タンパク質の消化吸収をサポート。", price: 1780, stock: 38, category: "supplement", status: "active", rating: 4.1, reviews: 34 },
  { name: "ビタミンB群", description: "エネルギー代謝に必須のビタミン群。", price: 1280, stock: 65, category: "supplement", status: "active", rating: 4.2, reviews: 56 },
  { name: "ビタミンC", description: "抗酸化作用と免疫サポート。", price: 980, stock: 80, category: "supplement", status: "active", rating: 4.4, reviews: 98 },
  { name: "鉄分サプリ", description: "貧血予防と酸素運搬能力をサポート。", price: 1080, stock: 50, category: "supplement", status: "active", rating: 4.0, reviews: 29 },

  // トレーニング器具 (40商品)
  { name: "トレーニングベルト レザー", description: "腰をしっかりサポートする本革ベルト。スクワット・デッドリフトに。", price: 3980, stock: 25, category: "equipment", status: "active", rating: 4.7, reviews: 89 },
  { name: "リストラップ", description: "手首を保護するラップ。ベンチプレスに必須。", price: 1480, originalPrice: 1980, stock: 100, category: "equipment", status: "active", rating: 4.4, reviews: 156 },
  { name: "ダンベルセット 20kg", description: "可変式ダンベル。初心者から中級者向け。", price: 8980, originalPrice: 9800, stock: 15, category: "equipment", status: "active", rating: 4.5, reviews: 78 },
  { name: "ダンベルセット 40kg", description: "本格的なトレーニングに。上級者向け可変式。", price: 15800, stock: 8, category: "equipment", status: "active", rating: 4.6, reviews: 45 },
  { name: "バーベルセット", description: "オリンピックバーベル20kg + プレート。", price: 24800, originalPrice: 29800, stock: 5, category: "equipment", status: "active", rating: 4.8, reviews: 34 },
  { name: "トレーニンググローブ", description: "グリップ力を高め、手のひらを保護。", price: 2480, stock: 60, category: "equipment", status: "active", rating: 4.2, reviews: 112 },
  { name: "ヨガマット 10mm", description: "クッション性抜群の厚手マット。", price: 2980, stock: 40, category: "equipment", status: "active", rating: 4.4, reviews: 98 },
  { name: "ヨガマット 6mm", description: "持ち運びに便利な標準厚さ。", price: 1980, stock: 55, category: "equipment", status: "active", rating: 4.3, reviews: 134 },
  { name: "フォームローラー", description: "筋膜リリースで疲労回復。", price: 2480, stock: 45, category: "equipment", status: "active", rating: 4.5, reviews: 167 },
  { name: "プッシュアップバー", description: "より深い可動域でプッシュアップ。", price: 1280, stock: 70, category: "equipment", status: "active", rating: 4.1, reviews: 89 },
  { name: "腹筋ローラー", description: "コア強化に最適なアブローラー。", price: 1480, stock: 65, category: "equipment", status: "active", rating: 4.3, reviews: 145 },
  { name: "チンニングバー", description: "ドア取り付け型の懸垂バー。", price: 3980, stock: 20, category: "equipment", status: "active", rating: 4.2, reviews: 67 },
  { name: "チンニングスタンド", description: "自立式の懸垂スタンド。ディップスも可能。", price: 16800, originalPrice: 19800, stock: 6, category: "equipment", status: "active", rating: 4.6, reviews: 43 },
  { name: "レジスタンスバンド セット", description: "5段階の強度で全身トレーニング。", price: 2980, stock: 50, category: "equipment", status: "active", rating: 4.4, reviews: 178 },
  { name: "ケトルベル 8kg", description: "ファンクショナルトレーニングに。初心者向け。", price: 3480, stock: 25, category: "equipment", status: "active", rating: 4.3, reviews: 56 },
  { name: "ケトルベル 16kg", description: "中級者向けの重量。スイングトレーニングに。", price: 5980, stock: 18, category: "equipment", status: "active", rating: 4.5, reviews: 38 },
  { name: "ケトルベル 24kg", description: "上級者向け。本格的なケトルベルトレーニング。", price: 8980, stock: 10, category: "equipment", status: "active", rating: 4.6, reviews: 24 },
  { name: "メディシンボール 5kg", description: "体幹トレーニングとプライオメトリクスに。", price: 4980, stock: 22, category: "equipment", status: "active", rating: 4.2, reviews: 34 },
  { name: "バランスボール 65cm", description: "体幹強化とストレッチに。", price: 2480, stock: 35, category: "equipment", status: "active", rating: 4.3, reviews: 89 },
  { name: "バランスボード", description: "バランス感覚と足首強化に。", price: 3980, stock: 28, category: "equipment", status: "active", rating: 4.1, reviews: 45 },
  { name: "ジャンプロープ", description: "スピードロープで有酸素運動。", price: 1280, stock: 80, category: "equipment", status: "active", rating: 4.4, reviews: 123 },
  { name: "アンクルウェイト 2kg", description: "足首に装着してトレーニング強度アップ。", price: 1980, stock: 45, category: "equipment", status: "active", rating: 4.0, reviews: 67 },
  { name: "アンクルウェイト 5kg", description: "より重い負荷で下半身強化。", price: 2980, stock: 30, category: "equipment", status: "active", rating: 4.2, reviews: 34 },
  { name: "リストウェイト 1kg", description: "手首に装着して上半身トレーニング。", price: 1480, stock: 50, category: "equipment", status: "active", rating: 4.1, reviews: 45 },
  { name: "パワーグリップ", description: "握力補助でより重い重量に挑戦。", price: 2980, stock: 0, category: "equipment", status: "out_of_stock", rating: 4.6, reviews: 98 },
  { name: "リフティングストラップ", description: "デッドリフトやローイングの握力補助に。", price: 1480, stock: 60, category: "equipment", status: "active", rating: 4.3, reviews: 112 },
  { name: "エルボースリーブ", description: "肘関節をサポートし保護。", price: 2480, stock: 35, category: "equipment", status: "active", rating: 4.4, reviews: 56 },
  { name: "ニースリーブ", description: "膝をサポートしスクワットをサポート。", price: 3480, stock: 28, category: "equipment", status: "active", rating: 4.5, reviews: 78 },
  { name: "パラレットバー", description: "Lシットやプランシェの練習に。", price: 4980, stock: 15, category: "equipment", status: "active", rating: 4.3, reviews: 32 },
  { name: "ディップスタンド", description: "上半身を鍛えるディップス専用。", price: 5980, stock: 12, category: "equipment", status: "active", rating: 4.4, reviews: 28 },
  { name: "プレートツリー", description: "ウェイトプレートを整理して収納。", price: 6980, stock: 8, category: "equipment", status: "active", rating: 4.2, reviews: 18 },
  { name: "ダンベルラック", description: "ダンベルを整理して収納。", price: 8980, stock: 5, category: "equipment", status: "active", rating: 4.5, reviews: 23 },
  { name: "フラットベンチ", description: "基本のトレーニングベンチ。", price: 9800, stock: 10, category: "equipment", status: "active", rating: 4.6, reviews: 67 },
  { name: "インクラインベンチ", description: "角度調整可能なトレーニングベンチ。", price: 14800, originalPrice: 16800, stock: 7, category: "equipment", status: "active", rating: 4.7, reviews: 45 },
  { name: "スクワットラック", description: "安全にスクワットを行うためのラック。", price: 29800, stock: 3, category: "equipment", status: "active", rating: 4.8, reviews: 21 },
  { name: "パワーラック", description: "本格的なホームジム用パワーラック。", price: 49800, stock: 2, category: "equipment", status: "active", rating: 4.9, reviews: 15 },
  { name: "トレーニングマット", description: "床を保護する衝撃吸収マット。", price: 4980, stock: 25, category: "equipment", status: "active", rating: 4.3, reviews: 56 },
  { name: "ストレッチポール", description: "背骨の調整とリラクゼーションに。", price: 3480, stock: 30, category: "equipment", status: "active", rating: 4.5, reviews: 89 },
  { name: "マッサージボール", description: "ピンポイントで筋肉をほぐす。", price: 980, stock: 100, category: "equipment", status: "active", rating: 4.2, reviews: 134 },
  { name: "マッサージガン", description: "電動マッサージで筋肉をリリース。", price: 12800, originalPrice: 14800, stock: 15, category: "equipment", status: "active", rating: 4.6, reviews: 98 },

  // ウェア (25商品)
  { name: "トレーニングTシャツ ブラック", description: "速乾性素材のトレーニング用Tシャツ。", price: 2480, stock: 45, category: "wear", status: "active", rating: 4.3, reviews: 89 },
  { name: "トレーニングTシャツ ホワイト", description: "速乾性素材のトレーニング用Tシャツ。", price: 2480, stock: 40, category: "wear", status: "active", rating: 4.3, reviews: 78 },
  { name: "トレーニングTシャツ グレー", description: "速乾性素材のトレーニング用Tシャツ。", price: 2480, stock: 35, category: "wear", status: "active", rating: 4.2, reviews: 67 },
  { name: "コンプレッションシャツ", description: "筋肉をサポートするタイトフィット。", price: 3980, stock: 30, category: "wear", status: "active", rating: 4.5, reviews: 112 },
  { name: "タンクトップ ブラック", description: "動きやすいノースリーブデザイン。", price: 1980, stock: 50, category: "wear", status: "active", rating: 4.1, reviews: 56 },
  { name: "タンクトップ ホワイト", description: "動きやすいノースリーブデザイン。", price: 1980, stock: 45, category: "wear", status: "active", rating: 4.1, reviews: 45 },
  { name: "トレーニングショーツ", description: "ストレッチ素材で動きやすい。", price: 2980, stock: 55, category: "wear", status: "active", rating: 4.4, reviews: 98 },
  { name: "トレーニングパンツ", description: "ジム通いに最適なジョガーパンツ。", price: 3980, stock: 40, category: "wear", status: "active", rating: 4.3, reviews: 67 },
  { name: "コンプレッションタイツ", description: "脚をサポートするロングタイツ。", price: 3480, stock: 35, category: "wear", status: "active", rating: 4.5, reviews: 89 },
  { name: "トレーニングパーカー", description: "ウォームアップに最適なパーカー。", price: 4980, stock: 25, category: "wear", status: "active", rating: 4.4, reviews: 56 },
  { name: "ジップアップジャケット", description: "軽量で通気性の良いジャケット。", price: 5480, stock: 20, category: "wear", status: "active", rating: 4.3, reviews: 34 },
  { name: "ストリンガータンク", description: "ボディビルダー向けの深いカットタンク。", price: 2480, stock: 30, category: "wear", status: "active", rating: 4.2, reviews: 45 },
  { name: "トレーニングキャップ", description: "汗を吸収するスポーツキャップ。", price: 1980, stock: 60, category: "wear", status: "active", rating: 4.0, reviews: 34 },
  { name: "ヘッドバンド", description: "汗止めスポーツヘッドバンド。", price: 980, stock: 80, category: "wear", status: "active", rating: 4.1, reviews: 56 },
  { name: "リストバンド", description: "汗を吸収するリストバンド 2個セット。", price: 780, stock: 90, category: "wear", status: "active", rating: 4.0, reviews: 43 },
  { name: "トレーニングソックス 3足セット", description: "クッション性のあるスポーツソックス。", price: 1480, stock: 70, category: "wear", status: "active", rating: 4.3, reviews: 78 },
  { name: "レディース スポーツブラ", description: "サポート力のあるスポーツブラ。", price: 3480, stock: 40, category: "wear", status: "active", rating: 4.6, reviews: 145 },
  { name: "レディース レギンス", description: "ハイウエストで動きやすいレギンス。", price: 3980, stock: 35, category: "wear", status: "active", rating: 4.5, reviews: 123 },
  { name: "レディース トレーニングトップ", description: "女性向けフィットネスウェア。", price: 2980, stock: 45, category: "wear", status: "active", rating: 4.4, reviews: 89 },
  { name: "レディース タンクトップ", description: "女性向けのフィットタンクトップ。", price: 2480, stock: 50, category: "wear", status: "active", rating: 4.3, reviews: 67 },
  { name: "トレーニングシューズ", description: "安定性重視のジムシューズ。", price: 8980, stock: 20, category: "wear", status: "active", rating: 4.5, reviews: 78 },
  { name: "デッドリフトシューズ", description: "フラットソールでデッドリフトに最適。", price: 6980, stock: 15, category: "wear", status: "active", rating: 4.6, reviews: 56 },
  { name: "スクワットシューズ", description: "ヒールリフト付きでスクワットに最適。", price: 12800, stock: 10, category: "wear", status: "active", rating: 4.7, reviews: 45 },
  { name: "アームスリーブ", description: "腕をサポートするコンプレッションスリーブ。", price: 1980, stock: 40, category: "wear", status: "active", rating: 4.2, reviews: 34 },
  { name: "カーフスリーブ", description: "ふくらはぎをサポートするスリーブ。", price: 1980, stock: 35, category: "wear", status: "active", rating: 4.2, reviews: 28 },

  // アクセサリー (15商品)
  { name: "シェイカーボトル 700ml", description: "プロテインを混ぜるのに最適なシェイカー。", price: 980, stock: 120, category: "accessories", status: "active", rating: 4.4, reviews: 234 },
  { name: "シェイカーボトル 1000ml", description: "大容量のシェイカーボトル。", price: 1280, stock: 80, category: "accessories", status: "active", rating: 4.3, reviews: 156 },
  { name: "ジムバッグ", description: "大容量のトレーニング用バッグ。", price: 4980, stock: 30, category: "accessories", status: "active", rating: 4.5, reviews: 89 },
  { name: "ジムバックパック", description: "シューズ収納付きリュック。", price: 5980, stock: 25, category: "accessories", status: "active", rating: 4.6, reviews: 67 },
  { name: "ウォーターボトル 1L", description: "BPAフリーの大容量ボトル。", price: 1480, stock: 65, category: "accessories", status: "active", rating: 4.2, reviews: 98 },
  { name: "ウォーターボトル 2L", description: "1日の水分摂取量を管理。", price: 1980, stock: 45, category: "accessories", status: "active", rating: 4.3, reviews: 78 },
  { name: "サプリメントケース", description: "携帯用のサプリ収納ケース。", price: 680, stock: 100, category: "accessories", status: "active", rating: 4.0, reviews: 56 },
  { name: "ピルケース 7日分", description: "1週間分のサプリを管理。", price: 480, stock: 120, category: "accessories", status: "active", rating: 4.1, reviews: 67 },
  { name: "ジムタオル", description: "速乾性のスポーツタオル。", price: 980, stock: 80, category: "accessories", status: "active", rating: 4.2, reviews: 89 },
  { name: "トレーニングノート", description: "ワークアウトを記録するノート。", price: 1280, stock: 55, category: "accessories", status: "active", rating: 4.4, reviews: 78 },
  { name: "フィットネストラッカー", description: "心拍数・歩数を計測するバンド。", price: 4980, stock: 20, category: "accessories", status: "active", rating: 4.3, reviews: 56 },
  { name: "体組成計", description: "体脂肪率・筋肉量を測定。", price: 5980, stock: 15, category: "accessories", status: "active", rating: 4.5, reviews: 89 },
  { name: "メジャー 巻尺", description: "体のサイズを測定。", price: 380, stock: 150, category: "accessories", status: "active", rating: 4.0, reviews: 45 },
  { name: "ワイヤレスイヤホン", description: "トレーニング用防水イヤホン。", price: 6980, stock: 18, category: "accessories", status: "active", rating: 4.4, reviews: 134 },
  { name: "液体チョーク", description: "手の滑りを防ぐチョーク。ジムOK。", price: 1280, stock: 40, category: "accessories", status: "active", rating: 4.5, reviews: 98 },
];

export default function SeedPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const handleSeed = async () => {
    if (!confirm("既存のデータを削除して120件の商品データを投入しますか？")) {
      return;
    }

    setStatus("loading");
    setMessage("既存データを削除中...");
    setProgress(0);

    try {
      // 既存データを削除
      const snapshot = await getDocs(collection(db, "products"));
      const deletePromises = snapshot.docs.map((document) =>
        deleteDoc(doc(db, "products", document.id))
      );
      await Promise.all(deletePromises);
      setMessage(`${snapshot.docs.length}件の既存データを削除しました`);

      // 新規データを投入
      const now = Timestamp.now();
      let count = 0;

      for (const product of products) {
        await addDoc(collection(db, "products"), {
          ...product,
          createdAt: now,
          updatedAt: now,
        });
        count++;
        setProgress(Math.floor((count / products.length) * 100));
        if (count % 10 === 0) {
          setMessage(`${count}/${products.length} 件投入完了`);
        }
      }

      setStatus("success");
      setMessage(`${count}件の商品データを投入しました`);
    } catch (error) {
      setStatus("error");
      setMessage(`エラーが発生しました: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="データ投入" />

      <main className="p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">商品データ投入</h2>
            <p className="text-gray-600 mb-6">
              Firestoreに120件の商品サンプルデータを投入します。
              既存のデータは削除されます。
            </p>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">投入されるデータ:</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>サプリメント: 40商品</li>
                <li>トレーニング器具: 40商品</li>
                <li>ウェア: 25商品</li>
                <li>アクセサリー: 15商品</li>
              </ul>
            </div>

            {status === "loading" && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            )}

            {status === "success" && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{message}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSeed}
                disabled={status === "loading"}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "投入中..." : "データを投入する"}
              </button>

              <Link
                href="/shop"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                ショップ管理へ
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
