"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MuscleGroup, muscleGroupLabels } from "@/lib/types/dummyUser";

interface HumanBodyEditorProps {
  muscleGroup: MuscleGroup;
  musclePosition: { x: number; y: number };
  imagePosition: { x: number; y: number };
  onMusclePositionChange: (pos: { x: number; y: number }) => void;
  onImagePositionChange: (pos: { x: number; y: number }) => void;
  imagePreviewUrl?: string | null;
  muscleName?: string;
}

// iOS EditMuscleHotspotView.swift と完全一致
const BASE_WIDTH = 370;  // let baseWidth: CGFloat = 370
const FRAME_HEIGHT = 350; // .frame(height: 350)
const IMAGE_SIZE = 120;   // customImageSize default (120x120)

// iOS getDefaultPosition(for:) 完全準拠
export const defaultMusclePositions: Record<MuscleGroup, { x: number; y: number }> = {
  chest: { x: 175, y: 140 },
  arms: { x: 115, y: 160 },
  shoulders: { x: 175, y: 120 },
  back: { x: 235, y: 160 },
  abs: { x: 175, y: 180 },
  legs: { x: 175, y: 280 },
  glutes: { x: 175, y: 240 },
};

// iOS getDefaultImagePosition(for:) 完全準拠
export const defaultImagePosition = { x: 60, y: 60 };

export default function HumanBodyEditor({
  muscleGroup,
  musclePosition,
  imagePosition,
  onMusclePositionChange,
  onImagePositionChange,
  imagePreviewUrl,
  muscleName,
}: HumanBodyEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<"muscle" | "image" | null>(null);

  const getSVGPoint = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: svgPt.x, y: svgPt.y };
    },
    []
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return;
      const point = getSVGPoint(clientX, clientY);
      if (!point) return;
      const x = Math.max(10, Math.min(BASE_WIDTH - 10, point.x));
      const y = Math.max(10, Math.min(FRAME_HEIGHT - 10, point.y));
      if (dragging === "muscle") {
        onMusclePositionChange({ x: Math.round(x), y: Math.round(y) });
      } else {
        onImagePositionChange({ x: Math.round(x), y: Math.round(y) });
      }
    },
    [dragging, getSVGPoint, onMusclePositionChange, onImagePositionChange]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
    };
    const onEnd = () => setDragging(null);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, handleMove]);

  const displayName =
    muscleName || muscleGroupLabels[muscleGroup] || muscleGroup;

  const halfImg = IMAGE_SIZE / 2;

  return (
    <div
      className="relative select-none mx-auto"
      style={{
        maxWidth: `${BASE_WIDTH}px`,
        // iOS Theme.cardBackgroundColor = Color(white: 0.1)
        backgroundColor: "#1A1A1A",
        // iOS Theme.cornerRadius = 8 (iPhone)
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BASE_WIDTH} ${FRAME_HEIGHT}`}
        className="w-full h-auto touch-none block"
      >
        {/* clipPath定義 */}
        {imagePreviewUrl && (
          <defs>
            <clipPath id="hotspot-img-clip">
              <rect
                x={imagePosition.x - halfImg}
                y={imagePosition.y - halfImg}
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
                rx="8"
                ry="8"
              />
            </clipPath>
          </defs>
        )}

        {/* ===== figure.stand 人体モデル ===== */}
        {/* iOS: Image(systemName: "figure.stand").font(.system(size: 280)) */}
        {/* iOS: .foregroundColor(Theme.dividerColor) = Color(white: 0.2) = #333333 */}
        {/* iOS: .position(x: geometry.size.width / 2, y: geometry.size.height / 2) */}
        <g fill="none" stroke="#333333" strokeLinecap="round">
          {/* 頭 */}
          <circle cx="185" cy="62" r="17" fill="#333333" stroke="none" />
          {/* 首〜胴体 */}
          <line x1="185" y1="79" x2="185" y2="200" strokeWidth="6" />
          {/* 左腕 */}
          <line x1="180" y1="98" x2="135" y2="175" strokeWidth="5.5" />
          {/* 右腕 */}
          <line x1="190" y1="98" x2="235" y2="175" strokeWidth="5.5" />
          {/* 左脚 */}
          <line x1="182" y1="200" x2="160" y2="315" strokeWidth="6.5" />
          {/* 右脚 */}
          <line x1="188" y1="200" x2="210" y2="315" strokeWidth="6.5" />
        </g>

        {/* ===== 接続線 ===== */}
        {/* iOS: Path { move(to:) addLine(to:) }.stroke(Color.white, lineWidth: 1).opacity(0.8) */}
        {imagePreviewUrl && (
          <line
            x1={musclePosition.x}
            y1={musclePosition.y}
            x2={imagePosition.x}
            y2={imagePosition.y}
            stroke="white"
            strokeWidth="1"
            opacity="0.8"
          />
        )}

        {/* ===== 画像プレビュー（ドラッグ可能） ===== */}
        {/* iOS: .frame(width: imageSize.width, height: imageSize.height).cornerRadius(8) */}
        {imagePreviewUrl && (
          <g
            style={{ cursor: dragging === "image" ? "grabbing" : "grab" }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragging("image");
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setDragging("image");
            }}
          >
            <image
              href={imagePreviewUrl}
              x={imagePosition.x - halfImg}
              y={imagePosition.y - halfImg}
              width={IMAGE_SIZE}
              height={IMAGE_SIZE}
              clipPath="url(#hotspot-img-clip)"
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        )}

        {/* ===== ホットスポット赤丸（ドラッグ可能） ===== */}
        {/* iOS: Circle().fill(Color.red.opacity(0.8)).frame(width: 40, height: 40) */}
        <g
          style={{ cursor: dragging === "muscle" ? "grabbing" : "grab" }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragging("muscle");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            setDragging("muscle");
          }}
        >
          {/* タッチ領域拡大用の透明円 */}
          <circle
            cx={musclePosition.x}
            cy={musclePosition.y}
            r="28"
            fill="transparent"
          />
          {/* 赤い円 (40x40 = r=20) */}
          <circle
            cx={musclePosition.x}
            cy={musclePosition.y}
            r="20"
            fill="rgba(255, 59, 48, 0.8)"
          />
          {/* iOS: Text(muscleName).font(.system(size: 10, weight: .bold)).foregroundColor(.white) */}
          <text
            x={musclePosition.x}
            y={musclePosition.y + 4}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            pointerEvents="none"
          >
            {displayName.length > 4 ? displayName.slice(0, 4) : displayName}
          </text>
        </g>
      </svg>

      {/* 操作ガイド */}
      <div
        className="absolute bottom-1 left-2 right-2 flex items-center justify-between pointer-events-none"
        style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}
      >
        <span>ドラッグで位置調整</span>
        {imagePreviewUrl && <span>画像もドラッグ可能</span>}
      </div>
    </div>
  );
}
