import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/firebase-server";
import { doc, getDoc } from "firebase/firestore/lite";
import { sendUserRegistrationNotification } from "@/lib/services/chatworkService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type !== "user_registered") {
      return NextResponse.json(
        { error: "Unknown notification type" },
        { status: 400 }
      );
    }

    const { userId, displayName, gender } = data || {};
    if (!userId || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields: userId, displayName" },
        { status: 400 }
      );
    }

    // Firestoreから Chatwork設定を取得
    const settingsDoc = await getDoc(doc(serverDb, "settings", "chatwork"));
    const roomId = settingsDoc.exists() ? settingsDoc.data()?.roomId : null;

    if (!roomId) {
      console.warn("Chatwork roomId が未設定です");
      return NextResponse.json(
        { error: "Chatwork roomId is not configured" },
        { status: 400 }
      );
    }

    const apiToken = process.env.CHATWORK_API_TOKEN;
    if (!apiToken) {
      console.error("CHATWORK_API_TOKEN 環境変数が未設定です");
      return NextResponse.json(
        { error: "Chatwork API token is not configured" },
        { status: 500 }
      );
    }

    await sendUserRegistrationNotification({
      roomId,
      apiToken,
      userId,
      displayName,
      gender: gender || "未設定",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chatwork通知エラー:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
