const crypto = require('crypto');
const Stripe = require('stripe');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');
const { STUBBED } = require('../utils/stripeStub');
const { onPaymentHeld } = require('../services/bookingFlow.service');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '10') / 100;

// POST /api/payments/intent  – sender initiates payment after booking accepted
const createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: { include: { traveler: true } },
        parcelRequest: true,
        payment: true,
      },
    });

    if (!booking) throw new AppError('Booking not found', 404);
    // Whoever is the payer (the recipient, if the sender asked them to pay; otherwise the sender).
    const payerFlow = !!(booking.payerId || booking.payerPhone);
    if (payerFlow && !booking.payerId) throw new AppError('Waiting for the recipient to join Amana and accept the request', 403);
    if ((booking.payerId || booking.senderId) !== req.user.id) throw new AppError('Forbidden', 403);
    if (payerFlow) {
      // Payment-first flow: the money is secured BEFORE the traveler is asked to accept.
      if (booking.status !== 'PAYMENT_PENDING') throw new AppError('This payment request is no longer open', 400);
      if (booking.payDeadline && booking.payDeadline < new Date()) throw new AppError('The payment deadline has passed', 400);
    } else if (booking.status !== 'ACCEPTED') {
      throw new AppError('Booking must be accepted before payment', 400);
    }
    if (booking.payment) throw new AppError('Payment already exists for this booking', 400);

    const traveler = booking.trip.traveler;
    // Real Stripe Connect requires the traveler to have onboarded a payout
    // account first. In stubbed/offline dev there's no real payout, so this
    // requirement is waived — it would otherwise block every test payment.
    if (!STUBBED && !traveler.stripeAccountId) {
      throw new AppError('Traveler has not set up their payout account yet', 400);
    }

    const baseAmount = booking.parcelRequest.weightKg * booking.trip.pricePerKg + (booking.priorityTip || 0);
    const platformFee = parseFloat((baseAmount * PLATFORM_FEE).toFixed(2));
    const travelerAmount = parseFloat((baseAmount - platformFee).toFixed(2));
    const grossAmount = baseAmount; // sender pays base; fee is deducted from traveler payout

    let clientSecret = null;
    let stripePaymentIntentId;

    if (STUBBED) {
      stripePaymentIntentId = `pi_stub_${crypto.randomBytes(10).toString('hex')}`;
    } else {
      // Amount in cents for Stripe
      const amountCents = Math.round(grossAmount * 100);
      const feeCents = Math.round(platformFee * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: booking.trip.currency.toLowerCase(),
        application_fee_amount: feeCents,
        transfer_data: { destination: traveler.stripeAccountId },
        metadata: { bookingId, senderId: req.user.id, travelerId: traveler.id },
      });
      clientSecret = paymentIntent.client_secret;
      stripePaymentIntentId = paymentIntent.id;
    }

    await prisma.payment.create({
      data: {
        bookingId,
        senderId: req.user.id,
        travelerId: traveler.id,
        grossAmount,
        platformFee,
        travelerAmount,
        currency: booking.trip.currency,
        stripePaymentIntentId,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      clientSecret,
      stubbed: STUBBED,
      amount: grossAmount,
      platformFee,
      travelerAmount,
    });
  } catch (err) { next(err); }
};

// POST /api/payments/:bookingId/confirm-stub — stand-in for the real Stripe
// webhook when running with no real Stripe account (local/offline dev only).
const confirmStubPayment = async (req, res, next) => {
  try {
    if (!STUBBED) throw new AppError('Not available: Stripe is configured for real payments', 400);

    const payment = await prisma.payment.findUnique({ where: { bookingId: req.params.bookingId } });
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    if (payment.status !== 'PENDING') throw new AppError(`Payment is already ${payment.status.toLowerCase()}`, 400);
    const bk = await prisma.booking.findUnique({ where: { id: payment.bookingId }, select: { status: true } });
    if (!bk || !['ACCEPTED', 'PAYMENT_PENDING'].includes(bk.status)) throw new AppError('This booking is no longer open for payment', 400);

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'HELD', paidAt: new Date() },
    });

    logger.info(`Stub payment confirmed for booking ${payment.bookingId}`);
    await onPaymentHeld(payment.bookingId);
    res.json({ success: true, payment: updated });
  } catch (err) { next(err); }
};

// POST /api/payments/webhook  – Stripe events
const handleWebhook = async (req, res, next) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      await prisma.payment.update({
        where: { stripePaymentIntentId: pi.id },
        data: { status: 'HELD', paidAt: new Date() },
      });
      const held = await prisma.payment.findUnique({ where: { stripePaymentIntentId: pi.id }, select: { bookingId: true } });
      if (held) await onPaymentHeld(held.bookingId);
      logger.info(`Payment held for PI ${pi.id}`);
    }

    if (event.type === 'transfer.created') {
      const transfer = event.data.object;
      const bookingId = transfer.metadata?.bookingId;
      if (bookingId) {
        await prisma.payment.update({
          where: { bookingId },
          data: { stripeTransferId: transfer.id, status: 'RELEASED', releasedAt: new Date() },
        });
      }
    }

    res.json({ received: true });
  } catch (err) { next(err); }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId: req.params.bookingId },
      include: { booking: { select: { senderId: true, payerId: true, trip: { select: { travelerId: true } } } } },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    if (![payment.booking.senderId, payment.booking.payerId, payment.booking.trip.travelerId].includes(req.user.id)) {
      throw new AppError('Forbidden', 403);
    }
    const { booking, ...rest } = payment;
    res.json({ success: true, payment: { ...rest, stubbed: STUBBED } });
  } catch (err) { next(err); }
};

module.exports = { createPaymentIntent, confirmStubPayment, handleWebhook, getPayment };
