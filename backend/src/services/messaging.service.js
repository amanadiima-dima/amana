const twilio = require('twilio');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

// ── Config ────────────────────────────────────────────────────────────────────
// Real sending needs a real Twilio account + at least one sender (WhatsApp and/or SMS).
// Without that (local/offline dev) messages are only recorded and logged ("STUB").
const looksReal = (v) => !!v && !/dummy|placeholder|your_|xxx/i.test(v);
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g. +14155238886 (sandbox) or your approved WhatsApp sender
const SMS_FROM = process.env.TWILIO_SMS_FROM;            // an SMS-capable number
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID; // alternative to SMS_FROM
const CHANNELS = (process.env.MESSAGING_CHANNELS || 'whatsapp,sms').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);

const STUBBED = !(/^AC[0-9a-f]{32}$/i.test(sid || '') && looksReal(token) && (looksReal(WHATSAPP_FROM) || looksReal(SMS_FROM) || looksReal(MESSAGING_SERVICE_SID)));
let client = null;
const getClient = () => (client ||= twilio(sid, token));

// ── Texts (kept short; WhatsApp business-initiated messages must match an approved template) ──
const TEXT = {
  en: ({ sender, route, amount, link }) => `${sender} asks you to pay for a parcel (${route}) sent through Amana — ${amount}. Your money stays protected until the parcel is delivered. Review and pay: ${link}`,
  fr: ({ sender, route, amount, link }) => `${sender} vous demande de payer un colis (${route}) envoyé via Amana — ${amount}. Votre argent reste protégé jusqu'à la livraison. Consulter et payer : ${link}`,
  es: ({ sender, route, amount, link }) => `${sender} te pide que pagues un paquete (${route}) enviado con Amana — ${amount}. Tu dinero queda protegido hasta la entrega. Revisar y pagar: ${link}`,
  ar: ({ sender, route, amount, link }) => `${sender} يطلب منك دفع ثمن طرد (${route}) يُرسل عبر أمانة — ${amount}. يبقى مالك محميًا حتى تسليم الطرد. للمراجعة والدفع: ${link}`,
};
const inviteText = (locale, vars) => (TEXT[locale] || TEXT.en)(vars);

const record = (data) => prisma.outboundMessage.create({ data }).catch((e) => logger.warn('could not record outbound message', { error: e.message }));

const sendWhatsApp = (to, body, locale, vars) => {
  const templateSid = process.env[`TWILIO_WHATSAPP_TEMPLATE_SID_${String(locale).toUpperCase()}`] || process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
  const base = { from: `whatsapp:${WHATSAPP_FROM}`, to: `whatsapp:${to}` };
  // Business-initiated WhatsApp requires an approved template; free text only works inside a 24h window / sandbox.
  return getClient().messages.create(
    templateSid
      ? { ...base, contentSid: templateSid, contentVariables: JSON.stringify({ 1: vars.sender, 2: vars.route, 3: vars.amount, 4: vars.link }) }
      : { ...base, body }
  );
};
const sendSms = (to, body) =>
  getClient().messages.create({ to, body, ...(looksReal(MESSAGING_SERVICE_SID) ? { messagingServiceSid: MESSAGING_SERVICE_SID } : { from: SMS_FROM }) });

// Invite someone to pay for a parcel. WhatsApp first, SMS as fallback (or whatever MESSAGING_CHANNELS says).
// Never throws: a failed message must not break the booking (the sender can still copy the link).
const sendPayerInvite = async ({ phone, locale = 'en', bookingId, sender, route, amount, link }) => {
  const vars = { sender, route, amount, link };
  const body = inviteText(locale, vars);

  if (STUBBED) {
    logger.info(`[MESSAGING STUB] to ${phone}: ${body}`);
    await record({ toPhone: phone, channel: 'STUB', kind: 'PAYER_INVITE', body, status: 'SENT', bookingId });
    return { channel: 'STUB', status: 'SENT', stubbed: true };
  }

  for (const ch of CHANNELS) {
    try {
      if (ch === 'whatsapp' && looksReal(WHATSAPP_FROM)) await sendWhatsApp(phone, body, locale, vars);
      else if (ch === 'sms' && (looksReal(SMS_FROM) || looksReal(MESSAGING_SERVICE_SID))) await sendSms(phone, body);
      else continue;
      await record({ toPhone: phone, channel: ch.toUpperCase(), kind: 'PAYER_INVITE', body, status: 'SENT', bookingId });
      return { channel: ch.toUpperCase(), status: 'SENT', stubbed: false };
    } catch (err) {
      logger.warn(`${ch} invite failed`, { error: err.message });
      await record({ toPhone: phone, channel: ch.toUpperCase(), kind: 'PAYER_INVITE', body, status: 'FAILED', error: String(err.message).slice(0, 300), bookingId });
    }
  }
  return { channel: null, status: 'FAILED', stubbed: false };
};

module.exports = { sendPayerInvite, inviteText, MESSAGING_STUBBED: STUBBED };
