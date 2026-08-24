const logger = require('../utils/logger');

// ── Firebase FCM (optional) ───────────────────────────────────────────────────
let messaging = null;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    messaging = admin.messaging();
  } catch (err) {
    logger.warn('Firebase initialization skipped', { error: err.message });
  }
}

// ── Expo Push API ─────────────────────────────────────────────────────────────
const sendExpoPushNotification = async (expoPushToken, title, body, data = {}) => {
  const payload = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json?.data?.status === 'error') {
    logger.warn('Expo push error', { details: json.data.details });
  }
};

// ── Main dispatcher — auto-detects token type ─────────────────────────────────
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  try {
    if (fcmToken.startsWith('ExponentPushToken[')) {
      await sendExpoPushNotification(fcmToken, title, body, data);
    } else if (messaging) {
      await messaging.send({
        token: fcmToken,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      });
    }
  } catch (err) {
    logger.warn('Push notification failed', { error: err.message });
  }
};

module.exports = { sendPushNotification };
