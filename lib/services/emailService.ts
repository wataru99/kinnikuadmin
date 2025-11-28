import nodemailer from "nodemailer";

// Gmail SMTP トランスポーター
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
};

// メール送信
export async function sendEmail({ to, subject, body }: SendEmailParams): Promise<void> {
  await transporter.sendMail({
    from: `"筋肉ショップ" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text: body,
  });
}

// 振込確認メール送信
export async function sendPaymentConfirmedEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  paymentDate: string;
  total: number;
  estimatedShippingDate: string;
}): Promise<void> {
  const subject = `【筋肉ショップ】ご入金を確認いたしました（注文番号: ${params.orderNumber}）`;
  const body = `${params.customerName} 様

いつも筋肉ショップをご利用いただき、誠にありがとうございます。

下記ご注文のご入金を確認いたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご入金情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号: ${params.orderNumber}
入金確認日: ${params.paymentDate}
入金金額: ¥${params.total.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

これより商品の発送準備を開始いたします。
発送予定日: ${params.estimatedShippingDate}

商品の発送が完了しましたら、追跡番号と共に改めてご連絡いたします。

ご不明な点がございましたら、お気軽にお問い合わせください。
今後とも筋肉ショップをよろしくお願いいたします。

──────────────────────────
筋肉ショップ
Email: information.orekin@gmail.com
──────────────────────────`;

  await sendEmail({ to: params.to, subject, body });
}

// 発送完了メール送信
export async function sendShippingCompleteEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  shippingDate: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  shippingAddress: string;
}): Promise<void> {
  const subject = `【筋肉ショップ】商品を発送いたしました（注文番号: ${params.orderNumber}）`;
  const body = `${params.customerName} 様

いつも筋肉ショップをご利用いただき、誠にありがとうございます。

ご注文いただきました商品を発送いたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 発送情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号: ${params.orderNumber}
発送日: ${params.shippingDate}
配送業者: ${params.carrier}
追跡番号: ${params.trackingNumber}

■ 配送状況の確認
${params.trackingUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お届け先
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${params.shippingAddress}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

お届けまで今しばらくお待ちください。
ご不在の場合は、不在票にてご連絡させていただきます。

商品到着後、万が一不具合等がございましたら、
7日以内にお問い合わせください。

ご不明な点がございましたら、お気軽にお問い合わせください。
今後とも筋肉ショップをよろしくお願いいたします。

──────────────────────────
筋肉ショップ
Email: information.orekin@gmail.com
──────────────────────────`;

  await sendEmail({ to: params.to, subject, body });
}
