const nodemailer = require('nodemailer');

const isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
}

const FROM = `"${process.env.EMAIL_FROM_NAME || 'Khan Mobile Shop'}" <${process.env.EMAIL_USER}>`;

// Sends best-effort — a failed/unconfigured email never blocks the order flow
// itself (checkout still succeeds even if the confirmation email can't be sent).
const sendMail = async ({ to, subject, html, attachments }) => {
  if (!isConfigured) {
    console.log(`[email] Skipped "${subject}" to ${to} — EMAIL_USER/EMAIL_APP_PASSWORD not set in .env.`);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html, attachments });
    return { sent: true };
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
};

const money = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`;

const itemsRowsHtml = (items) =>
  items.map((i) => `
    <tr>
      <td style="padding:8px 0;color:#0F172A;">${i.name} × ${i.quantity}</td>
      <td style="padding:8px 0;text-align:right;color:#0F172A;">${money(i.price * i.quantity)}</td>
    </tr>
  `).join('');

const emailShell = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h2 style="color:#0F172A;">${title}</h2>
    ${bodyHtml}
    <p style="color:#94A3B8; font-size:12px; margin-top:32px;">Khan Mobile Shop · Near UBL Bank Industrial Estate Multan</p>
  </div>
`;

const sendOrderConfirmationEmail = (order) => sendMail({
  to: order.email,
  subject: `Order Confirmed — ${order.orderNumber}`,
  html: emailShell('Thanks for your order!', `
    <p style="color:#334155;">Hi ${order.fullName || ''}, your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">${itemsRowsHtml(order.items)}</table>
    <p style="color:#0F172A; font-weight:bold; font-size:16px;">Total: ${money(order.total)}</p>
    <p style="color:#334155;">We'll email you again once it ships.</p>
  `),
});

const STATUS_MESSAGES = {
  processing: 'Your order is now being processed.',
  shipped: 'Your order is on its way!',
  delivered: 'Your order has been delivered. We hope you love it!',
  cancelled: 'Your order has been cancelled.',
};

const sendOrderStatusEmail = (order, status) => {
  const message = STATUS_MESSAGES[status];
  if (!message) return Promise.resolve({ sent: false, reason: 'no_template_for_status' });
  return sendMail({
    to: order.email,
    subject: `Order ${order.orderNumber} — ${status[0].toUpperCase() + status.slice(1)}`,
    html: emailShell(message, `
      <p style="color:#334155;">Order <strong>${order.orderNumber}</strong> is now <strong>${status}</strong>.</p>
      <p style="color:#334155;">Track it anytime from your <a href="${process.env.CLIENT_URL}/orders" style="color:#3B82F6;">My Orders</a> page.</p>
    `),
  });
};

 const sendVerificationEmail = (user, verifyUrl) => sendMail({
  to: user.email,
  subject: 'Verify your email — Khan Mobile Shop',
  html: emailShell('Confirm your email address', `
    <p style="color:#334155;">Hi ${user.name}, thanks for signing up! Click the button below to verify your email address.</p>
    <p style="margin: 24px 0;">
      <a href="${verifyUrl}" style="background:#3B82F6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify Email</a>
    </p>
    <p style="color:#94A3B8; font-size:12px;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
  `),
});

module.exports = { sendMail, sendOrderConfirmationEmail, sendOrderStatusEmail, sendVerificationEmail, isConfigured };