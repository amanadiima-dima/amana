// Fail fast on an unsafe/incomplete production setup instead of running half-broken (or insecure).
const logger = require('./logger');

const isHosted = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;

const checkEnv = () => {
  const problems = [];
  const warnings = [];

  if (process.env.OTP_BYPASS === 'true' && isHosted) {
    problems.push('OTP_BYPASS=true must never be enabled on a hosted server (anyone could log in as anyone).');
  }
  if (!isHosted) return;

  const need = [
    'DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'CORS_ORIGIN', 'WEB_URL',
    'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID',
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  ];
  for (const k of need) if (!process.env[k]) problems.push(`${k} is not set`);
  for (const k of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const v = process.env[k] || '';
    if (v && (v.length < 32 || /dummy|changeme|secret$/i.test(v))) problems.push(`${k} is too weak (use 32+ random characters)`);
  }
  if (process.env.PAYMENTS_MODE !== 'stripe') warnings.push('PAYMENTS_MODE is not "stripe": payments are SIMULATED (no real money moves).');

  warnings.forEach((w) => logger.warn(w));
  if (problems.length) {
    problems.forEach((p) => logger.error(`Config problem: ${p}`));
    throw new Error(`Refusing to start: ${problems.length} configuration problem(s) — see log above`);
  }
};

module.exports = checkEnv;
