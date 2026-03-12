const CHATWORK_API_BASE = "https://api.chatwork.com/v2";

export async function sendChatworkMessage(
  roomId: string,
  message: string,
  apiToken: string
): Promise<void> {
  const url = `${CHATWORK_API_BASE}/rooms/${roomId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-ChatWorkToken": apiToken,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ body: message }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Chatwork API error (${res.status}): ${errorText}`);
  }
}

export async function sendUserRegistrationNotification(params: {
  roomId: string;
  apiToken: string;
  userId: string;
  displayName: string;
  gender: string;
}): Promise<void> {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  const timeStr = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const genderLabel =
    params.gender === "male"
      ? "男性"
      : params.gender === "female"
        ? "女性"
        : params.gender;

  const message = `[info][title]新規ユーザー登録[/title]ユーザー名: ${params.displayName}\n性別: ${genderLabel}\nユーザーID: ${params.userId}\n登録日時: ${dateStr} ${timeStr}[/info]`;

  await sendChatworkMessage(params.roomId, message, params.apiToken);
}
