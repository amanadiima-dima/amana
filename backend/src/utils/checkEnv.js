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
  // Catch pasted-placeholder / wrong-field mistakes with a clear message (instead of a stack trace later).
  const v = (k) => process.env[k] || '';
  for (const k of need) if (/[<>"'\s]/.test(v(k))) problems.push(`${k} contains <, >, quotes or spaces — paste only the value`);
  if (v('DATABASE_URL') && !/^postgres(ql)?:\/\//.test(v('DATABASE_URL'))) problems.push('DATABASE_URL must start with postgresql://');
  if (v('TWILIO_ACCOUNT_SID') && !/^AC[0-9a-f]{32}$/i.test(v('TWILIO_ACCOUNT_SID'))) problems.push('TWILIO_ACCOUNT_SID must be the Account SID that starts with "AC" (34 characters)');
  if (v('TWILIO_VERIFY_SERVICE_SID') && !/^VA[0-9a-f]{32}$/i.test(v('TWILIO_VERIFY_SERVICE_SID'))) problems.push('TWILIO_VERIFY_SERVICE_SID must be the Verify Service SID that starts with "VA" (34 characters)');
  if (v('TWILIO_AUTH_TOKEN') && /^(AC|VA)[0-9a-f]{32}$/i.test(v('TWILIO_AUTH_TOKEN'))) problems.push('TWILIO_AUTH_TOKEN looks like a SID — use the Auth Token from the Twilio dashboard (32 characters, not starting with AC/VA)');
  for (const k of ['CORS_ORIGIN', 'WEB_URL']) {
    if (v(k) && !/^https:\/\/[^\s/]+$/.test(v(k).split(',')[0].trim())) problems.push(`${k} must look like https://your-web-domain (https, no trailing slash)`);
  }
  const testPhones = v('TEST_PHONES').split(',').map((p) => p.trim()).filter(Boolean);
  if (testPhones.some((p) => !/^\+[1-9]\d{7,14}$/.test(p))) problems.push('TEST_PHONES must be phone numbers like +447700900101, separated by commas');
  if (testPhones.length) warnings.push(`TEST_PHONES: ${testPhones.length} test account(s) sign in with code 123456 (no SMS).`);
    if (process.env.PAYMENTS_MODE !== 'stripe') warnings.push('PAYMENTS_MODE is not "stripe": payments are SIMULATED (no real money moves).');

  warnings.forEach((w) => logger.warn(w));
  if (problems.length) {
    problems.forEach((p) => logger.error(`Config problem: ${p}`));
    throw new Error(`Refusing to start: ${problems.length} configuration problem(s) — see log above`);
  }
};

module.exports = checkEnv;
