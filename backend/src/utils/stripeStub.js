// Payments are SIMULATED unless explicitly switched to real Stripe with PAYMENTS_MODE=stripe AND a real key.
// (Default is simulated on purpose: the real-Stripe flow still needs rework before it can hold real money —
// see the escrow notes in the project docs — so a Stripe key alone must never turn it on.)
// Local dev with a dummy/missing key is simulated as well.
const key = process.env.STRIPE_SECRET_KEY || '';
const looksReal = !!key && !/dummy|changeme|your_stripe|placeholder/i.test(key);
const STUBBED = !(process.env.PAYMENTS_MODE === 'stripe' && looksReal);

module.exports = { STUBBED };
