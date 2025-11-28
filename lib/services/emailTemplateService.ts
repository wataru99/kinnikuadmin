import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export type EmailTemplateType =
  | "order_complete_credit"
  | "order_complete_bank"
  | "payment_confirmed"
  | "shipping_complete";

export type EmailTemplate = {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  description: string;
  variables: string[]; // 使用可能な変数一覧
  createdAt: string;
  updatedAt: string;
};

const COLLECTION_NAME = "email_templates";

// テンプレートタイプの表示名
export const templateTypeLabels: Record<EmailTemplateType, string> = {
  order_complete_credit: "注文完了メール（クレジットカード）",
  order_complete_bank: "注文完了メール（銀行振込）",
  payment_confirmed: "振込確認メール",
  shipping_complete: "発送完了メール",
};

// テンプレートタイプの説明
export const templateTypeDescriptions: Record<EmailTemplateType, string> = {
  order_complete_credit: "クレジットカード決済完了後に自動送信されます",
  order_complete_bank: "銀行振込選択時に振込先情報と共に送信されます",
  payment_confirmed: "銀行振込の入金確認後に送信されます",
  shipping_complete: "商品発送時に追跡番号と共に送信されます",
};

// 使用可能な変数一覧
export const availableVariables: Record<EmailTemplateType, string[]> = {
  order_complete_credit: [
    "{{customer_name}}",
    "{{order_number}}",
    "{{order_date}}",
    "{{order_items}}",
    "{{subtotal}}",
    "{{tax}}",
    "{{shipping}}",
    "{{total}}",
    "{{shipping_address}}",
  ],
  order_complete_bank: [
    "{{customer_name}}",
    "{{order_number}}",
    "{{order_date}}",
    "{{order_items}}",
    "{{subtotal}}",
    "{{tax}}",
    "{{shipping}}",
    "{{total}}",
    "{{shipping_address}}",
    "{{bank_name}}",
    "{{branch_name}}",
    "{{account_type}}",
    "{{account_number}}",
    "{{account_holder}}",
    "{{payment_deadline}}",
  ],
  payment_confirmed: [
    "{{customer_name}}",
    "{{order_number}}",
    "{{payment_date}}",
    "{{total}}",
    "{{estimated_shipping_date}}",
  ],
  shipping_complete: [
    "{{customer_name}}",
    "{{order_number}}",
    "{{shipping_date}}",
    "{{carrier}}",
    "{{tracking_number}}",
    "{{tracking_url}}",
    "{{shipping_address}}",
  ],
};

// Firestore のドキュメントを EmailTemplate 型に変換
function docToEmailTemplate(id: string, data: Record<string, unknown>): EmailTemplate {
  return {
    id,
    type: data.type as EmailTemplateType,
    name: data.name as string,
    subject: data.subject as string,
    body: data.body as string,
    description: data.description as string,
    variables: data.variables as string[],
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate().toISOString()
      : data.createdAt as string,
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt as string,
  };
}

// 全テンプレート取得
export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  if (!db) throw new Error("Firestore is not initialized");

  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.docs.map((doc) => docToEmailTemplate(doc.id, doc.data()));
}

// テンプレート取得（タイプ指定）
export async function getEmailTemplateByType(type: EmailTemplateType): Promise<EmailTemplate | null> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, type);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return docToEmailTemplate(snapshot.id, snapshot.data());
}

// テンプレート更新
export async function updateEmailTemplate(
  type: EmailTemplateType,
  data: { subject: string; body: string }
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const docRef = doc(db, COLLECTION_NAME, type);
  await updateDoc(docRef, {
    subject: data.subject,
    body: data.body,
    updatedAt: Timestamp.now(),
  });
}

// テンプレート作成（初期化用）
export async function createEmailTemplate(template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized");

  const now = Timestamp.now();
  const docRef = doc(db, COLLECTION_NAME, template.type);

  await setDoc(docRef, {
    ...template,
    createdAt: now,
    updatedAt: now,
  });
}

// 初期テンプレートデータ
export const initialTemplates: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">[] = [
  {
    type: "order_complete_credit",
    name: "注文完了メール（クレジットカード）",
    subject: "【筋肉ショップ】ご注文ありがとうございます（注文番号: {{order_number}}）",
    body: `{{customer_name}} 様

この度は筋肉ショップをご利用いただき、誠にありがとうございます。
以下の内容でご注文を承りました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご注文情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号: {{order_number}}
注文日時: {{order_date}}

■ ご注文商品
{{order_items}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お支払い金額
━━━━━━━━━━━━━━━━━━━━━━━━━━━
小計: ¥{{subtotal}}
消費税: ¥{{tax}}
送料: ¥{{shipping}}
──────────────────────────
合計: ¥{{total}}

お支払い方法: クレジットカード（決済完了）

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お届け先
━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{shipping_address}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

商品の発送準備が整いましたら、改めてご連絡いたします。
ご不明な点がございましたら、お気軽にお問い合わせください。

今後とも筋肉ショップをよろしくお願いいたします。

──────────────────────────
筋肉ショップ
Email: support@kinniku-shop.example.com
Tel: 03-1234-5678（平日 10:00〜18:00）
──────────────────────────`,
    description: "クレジットカード決済完了後に自動送信されます",
    variables: availableVariables.order_complete_credit,
  },
  {
    type: "order_complete_bank",
    name: "注文完了メール（銀行振込）",
    subject: "【筋肉ショップ】ご注文ありがとうございます - お振込のお願い（注文番号: {{order_number}}）",
    body: `{{customer_name}} 様

この度は筋肉ショップをご利用いただき、誠にありがとうございます。
以下の内容でご注文を承りました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご注文情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号: {{order_number}}
注文日時: {{order_date}}

■ ご注文商品
{{order_items}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お支払い金額
━━━━━━━━━━━━━━━━━━━━━━━━━━━
小計: ¥{{subtotal}}
消費税: ¥{{tax}}
送料: ¥{{shipping}}
──────────────────────────
合計: ¥{{total}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お振込先情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
金融機関: {{bank_name}}
支店名: {{branch_name}}
口座種別: {{account_type}}
口座番号: {{account_number}}
口座名義: {{account_holder}}

【お振込期限】{{payment_deadline}}

※ 振込手数料はお客様のご負担となります。
※ ご注文者名と振込名義が異なる場合は、事前にお問い合わせください。
※ お振込期限を過ぎた場合、ご注文がキャンセルとなる場合がございます。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お届け先
━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{shipping_address}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

ご入金確認後、商品の発送準備を開始いたします。
ご不明な点がございましたら、お気軽にお問い合わせください。

今後とも筋肉ショップをよろしくお願いいたします。

──────────────────────────
筋肉ショップ
Email: support@kinniku-shop.example.com
Tel: 03-1234-5678（平日 10:00〜18:00）
──────────────────────────`,
    description: "銀行振込選択時に振込先情報と共に送信されます",
    variables: availableVariables.order_complete_bank,
  },
  {
    type: "payment_confirmed",
    name: "振込確認メール",
    subject: "【筋肉ショップ】ご入金を確認いたしました（注文番号: {{order_number}}）",
    body: `{{customer_name}} 様

いつも筋肉ショップをご利用いただき、誠にありがとうございます。

下記ご注文のご入金を確認いたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご入金情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号: {{order_number}}
入金確認日: {{payment_date}}
入金金額: ¥{{total}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

これより商品の発送準備を開始いたします。
発送予定日: {{estimated_shipping_date}}

商品の発送が完了しましたら、追跡番号と共に改めてご連絡いたします。

ご不明な点がございましたら、お気軽にお問い合わせください。
今後とも筋肉ショップをよろしくお願いいたします。

──────────────────────────
筋肉ショップ
Email: support@kinniku-shop.example.com
Tel: 03-1234-5678（平日 10:00〜18:00）
──────────────────────────`,
    description: "銀行振込の入金確認後に送信されます",
    variables: availableVariables.payment_confirmed,
  },
  {
    type: "shipping_complete",
    name: "発送完了メール",
    subject: "【筋肉ショップ】商品を発送いたしました（注文番号: {{order_number}}）",
    body: `{{customer_name}} 様

いつも筋肉ショップをご利用いただき、誠にありがとうございます。

ご注文いただきました商品を発送いたしました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 発送情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号: {{order_number}}
発送日: {{shipping_date}}
配送業者: {{carrier}}
追跡番号: {{tracking_number}}

■ 配送状況の確認
{{tracking_url}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ お届け先
━━━━━━━━━━━━━━━━━━━━━━━━━━━
{{shipping_address}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━

お届けまで今しばらくお待ちください。
ご不在の場合は、不在票にてご連絡させていただきます。

商品到着後、万が一不具合等がございましたら、
7日以内にお問い合わせください。

ご不明な点がございましたら、お気軽にお問い合わせください。
今後とも筋肉ショップをよろしくお願いいたします。

──────────────────────────
筋肉ショップ
Email: support@kinniku-shop.example.com
Tel: 03-1234-5678（平日 10:00〜18:00）
──────────────────────────`,
    description: "商品発送時に追跡番号と共に送信されます",
    variables: availableVariables.shipping_complete,
  },
];

// 初期テンプレートを投入
export async function seedEmailTemplates(): Promise<void> {
  for (const template of initialTemplates) {
    await createEmailTemplate(template);
  }
}

// 個別テンプレートを作成
export async function seedSingleTemplate(type: EmailTemplateType): Promise<void> {
  const template = initialTemplates.find(t => t.type === type);
  if (!template) {
    throw new Error(`Template not found for type: ${type}`);
  }
  await createEmailTemplate(template);
}
