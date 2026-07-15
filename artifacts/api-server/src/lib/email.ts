// Email utility using nodemailer with Gmail SMTP
// Requires GMAIL_USER and GMAIL_PASS env vars (Gmail App Password)
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "saiedandmoka@gmail.com";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export async function sendTicketNotification(ticket: {
  username: string;
  title: string;
  description: string;
}): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return; // Silent skip if not configured

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
