import { NextRequest, NextResponse } from "next/server";
import {
  sendPaymentConfirmedEmail,
  sendShippingCompleteEmail,
} from "@/lib/services/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case "payment_confirmed":
        await sendPaymentConfirmedEmail(data);
        break;
      case "shipping_complete":
        await sendShippingCompleteEmail(data);
        break;
      default:
        return NextResponse.json(
          { error: "Unknown email type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("メール送信エラー:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
