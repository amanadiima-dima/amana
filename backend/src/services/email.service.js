const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

// ── Config ────────────────────────────────────────────────────────────────────
// Notification emails go through Resend's HTTP API. Without a real key (local/offline dev,
// or until the owner sets RESEND_API_KEY) they are only recorded ("EMAIL_STUB").
const API_KEY = process.env.RESEND_API_KEY;
const STUBBED = !/^re_[A-Za-z0-9_-]+$/.test(API_KEY || '');
const FROM = process.env.EMAIL_FROM || 'Amana <notifications@amanadima.com>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'soporte@amanadima.com';
const WEB_URL = (process.env.WEB_URL || (process.env.CORS_ORIGIN || '').split(',')[0] || 'http://localhost:3001').replace(/\/$/, '');
const SEND_GAP_MS = 600; // stay under the provider's per-second limit
const MESSAGE_EMAIL_GAP_MS = 30 * 60 * 1000; // a busy chat sends one email per person every 30 min, not one per message

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const render = ({ title, body, link }) => ({
  text: `${title}\n\n${body}\n\nOpen Amana: ${link}\n\nYou get this email because this address is on an Amana account. Not you? Just reply to this email.`,
  html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111827">
<p style="font-size:20px;font-weight:bold;color:#2563eb;margin:0 0 24px">Amana</p>
<p style="font-size:18px;font-weight:bold;margin:0 0 8px">${esc(title)}</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 24px;color:#374151">${esc(body)}</p>
<a href="${esc(link)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px">Open Amana</a>
<p style="font-size:12px;line-height:1.5;color:#9ca3af;margin:32px 0 0">You get this email because this address is on an Amana account. Not you? Just reply to this email.</p>
</div>`,
});

const record = (data) => prisma.outboundMessage.create({ data }).catch((e) => logger.warn('could not record outbound email', { error: e.message }));

const deliver = async (user, title, body, data) => {
  const kind = data.type || 'NOTIFICATION';
  const bookingId = data.bookingId || null;
  if (kind === 'MESSAGE') {
    const recent = await prisma.outboundMessage.count({
      where: { toPhone: user.phone, bookingId, kind, status: 'SENT', createdAt: { gte: new Date(Date.now() - MESSAGE_EMAIL_GAP_MS) } },
    });
    if (recent > 0) return;
  }
  // Only the title is kept in the record: the text itself stays in the in-app notification.
  const base = { toPhone: user.phone, kind, body: title, bookingId };
  if (STUBBED) {
    await record({ ...base, channel: 'EMAIL_STUB', status: 'SENT' });
    return;
  }
  const link = `${WEB_URL}${bookingId ? `/bookings/${bookingId}` : '/notifications'}`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [user.email], reply_to: REPLY_TO, subject: title, ...render({ title, body, link }) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Resend answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
    await record({ ...base, channel: 'EMAIL', status: 'SENT' });
  } catch (err) {
    logger.warn('notification email failed', { error: err.message });
    await record({ ...base, channel: 'EMAIL', status: 'FAILED', error: String(err.message).slice(0, 300) });
  }
  await new Promise((r) => setTimeout(r, SEND_GAP_MS));
};

// Email these users (those with an address). Runs in the background, one at a time, and never throws:
// a failed email must not break the action, and the in-app notification is already there.
let queue = Promise.resolve();
const emailUsers = (userIds, title, body, data = {}) => {
  queue = queue
    .then(async () => {
      const users = await prisma.user.findMany({
        where: { id: { in: userIds }, email: { not: null }, isActive: true, deletedAt: null },
        select: { phone: true, email: true },
      });
      for (const user of users) await deliver(user, title, body, data);
    })
    .catch((err) => logger.warn('notification emails failed', { error: err.message }));
  return queue;
};

module.exports = { emailUsers, EMAIL_STUBBED: STUBBED };
