const crypto = require('crypto');
const Stripe = require('stripe');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { STUBBED } = require('../utils/stripeStub');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const releasePayment = async (payment) => {
  try {
    const stripeTransferId = STUBBED
      ? `tr_stub_${crypto.randomBytes(8).toString('hex')}`
      : (
        await stripe.transfers.create({
          amount: Math.round(payment.travelerAmount * 100),
          currency: payment.currency || 'eur',
          destination: payment.travelerId, // Stripe account ID stored on User
          metadata: { bookingId: payment.bookingId },
        })
      ).id;

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeTransferId, status: 'RELEASED', releasedAt: new Date() },
    });

    logger.info(`Payment released for booking ${payment.bookingId}${STUBBED ? ' (stubbed)' : ''}`);
  } catch (err) {
    logger.error('Failed to release payment', { error: err.message, paymentId: payment.id });
    throw err;
  }
};

const refundPayment = async (payment) => {
  try {
    if (!STUBBED) {
      await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
    logger.info(`Payment refunded for booking ${payment.bookingId}${STUBBED ? ' (stubbed)' : ''}`);
  } catch (err) {
    logger.error('Failed to refund payment', { error: err.message, paymentId: payment.id });
    throw err;
  }
};

module.exports = { releasePayment, refundPayment };
