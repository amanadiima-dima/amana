const Stripe = require('stripe');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const releasePayment = async (payment) => {
  try {
    // Transfer funds to traveler's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(payment.travelerAmount * 100),
      currency: payment.currency || 'eur',
      destination: payment.travelerId, // Stripe account ID stored on User
      metadata: { bookingId: payment.bookingId },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeTransferId: transfer.id, status: 'RELEASED', releasedAt: new Date() },
    });

    logger.info(`Payment released for booking ${payment.bookingId}`);
  } catch (err) {
    logger.error('Failed to release payment', { error: err.message, paymentId: payment.id });
    throw err;
  }
};

const refundPayment = async (payment) => {
  try {
    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED', refundedAt: new Date() },
    });
    logger.info(`Payment refunded for booking ${payment.bookingId}`);
  } catch (err) {
    logger.error('Failed to refund payment', { error: err.message, paymentId: payment.id });
    throw err;
  }
};

module.exports = { releasePayment, refundPayment };
