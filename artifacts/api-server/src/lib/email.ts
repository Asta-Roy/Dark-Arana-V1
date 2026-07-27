// خدمة الإيميل باستخدام nodemailer مع Gmail SMTP
// المتغيرات المطلوبة: GMAIL_USER و GMAIL_PASS (App Password من Google)
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "saiedandmoka@gmail.com";

// ─── OTP Store (في الذاكرة — code expires in 5 min) ──────────────────────────
// Map من الإيميل إلى { code, expiresAt }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// توليد كود OTP عشوائي من 6 أرقام
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// حفظ الكود لمدة 5 دقايق
export function storeOTP(email: string, code: string): void {
  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 دقايق
  });
}

// التحقق من الكود — بيمسحه بعد ما يتحقق منه
export function verifyOTP(email: string, code: string): boolean {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return false;
  }
  if (entry.code !== code) return false;
  // الكود صح — امسحه عشان ميتستخدمش تاني
  otpStore.delete(email.toLowerCase());
  return true;
}

// ─── Nodemailer Transport ─────────────────────────────────────────────────────
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

// ─── إرسال كود OTP للتسجيل ────────────────────────────────────────────────────
export async function sendOTPEmail(toEmail: string, code: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    // لو الإيميل مش معمول إعداد — سجّل الكود في الكونسول للتطوير
    console.log(`[OTP DEV] ${toEmail} → ${code}`);
    return;
  }

  await transporter.sendMail({
    from: `"Dark Arena AI" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "كود التحقق من Dark Arena",
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;border-radius:16px;padding:32px;border:1px solid #1e1e2e">
        <h2 style="color:#8B52FF;margin:0 0 8px">⬡ Dark Arena</h2>
        <p style="color:#a0a0b0;margin:0 0 24px;font-size:14px">مساعدك الذكي</p>
        <h3 style="color:#fff;margin:0 0 16px">كود التحقق من حسابك</h3>
        <p style="color:#ccc;margin:0 0 24px">استخدم الكود التالي لإكمال التسجيل. صالح لمدة 5 دقائق فقط.</p>
        <div style="background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;border:1px solid #8B52FF44">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#8B52FF">${code}</span>
        </div>
        <p style="color:#666;margin:24px 0 0;font-size:12px">لو مش أنت اللي طلب الكود دا، تجاهل الرسالة.</p>
      </div>
    `,
  });
}

// ─── إشعار الادمن بتذكرة جديدة ───────────────────────────────────────────────
export async function sendTicketNotification(ticket: {
  username: string;
  title: string;
  description: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: ADMIN_EMAIL,
    subject: `[دارك أرانا] تذكرة جديدة من ${ticket.username}`,
    html: `
      <div dir="rtl" style="font-family:Arial;padding:20px">
        <h2>تذكرة دعم جديدة</h2>
        <p><strong>المستخدم:</strong> ${ticket.username}</p>
        <p><strong>العنوان:</strong> ${ticket.title}</p>
        <p><strong>الوصف:</strong> ${ticket.description}</p>
        <hr/>
        <p>يمكنك الرد من لوحة الادمن في التطبيق.</p>
      </div>
    `,
  });
}

// ─── إرسال رد الادمن للمستخدم ────────────────────────────────────────────────
export async function sendTicketReply(opts: {
  toEmail: string;
  username: string;
  ticketTitle: string;
  adminReply: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: opts.toEmail,
    subject: `[دارك أرانا] رد على تذكرتك: ${opts.ticketTitle}`,
    html: `
      <div dir="rtl" style="font-family:Arial;padding:20px">
        <h2>رد على تذكرة الدعم</h2>
        <p>مرحباً ${opts.username},</p>
        <p><strong>تذكرتك:</strong> ${opts.ticketTitle}</p>
        <hr/>
        <p><strong>رد الدعم:</strong></p>
        <p>${opts.adminReply}</p>
        <hr/>
        <p>شكراً لاستخدامك دارك أرانا AI.</p>
      </div>
    `,
  });
}
