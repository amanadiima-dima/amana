const Stripe = require('stripe');
const prisma = require('../utils/prisma');
const { AppError } = require('../middlewares/error.middleware');
const logger = require('../utils/logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
    if (booking.senderId !== req.user.id) throw new AppError('Forbidden', 403);
    if (booking.status !== 'ACCEPTED') throw new AppError('Booking must be accepted before payment', 400);
    if (booking.payment) throw new AppError('Payment already exists for this booking', 400);

    const traveler = booking.trip.traveler;
    if (!traveler.stripeAccountId) {
      throw new AppError('Traveler has not set up their payout account yet', 400);
    }

    const baseAmount = booking.parcelRequest.weightKg * booking.trip.pricePerKg;
    const platformFee = parseFloat((baseAmount * PLATFORM_FEE).toFixed(2));
    const travelerAmount = parseFloat((baseAmount - platformFee).toFixed(2));
    const grossAmount = baseAmount; // sender pays base; fee is deducted from traveler payout

    // Amount in cents for Stripe
    const amountCents = Math.round(grossAmount * 100);
    const feeCents = Math.round(platformFee * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'eur',
      application_fee_amount: feeCents,
      transfer_data: { destination: traveler.stripeAccountId },
      metadata: { bookingId, senderId: req.user.id, travelerId: traveler.id },
    });

    await prisma.payment.create({
      data: {
        bookingId,
        senderId: req.user.id,
        travelerId: traveler.id,
        grossAmount,
        platformFee,
        travelerAmount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: grossAmount,
      platformFee,
      travelerAmount,
    });
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
    const payment = await prisma.payment.findUnique({ where: { bookingId: req.params.bookingId } });
    if (!payment) throw new AppError('Payment not found', 404);
    res.json({ success: true, payment });
  } catch (err) { next(err); }
};

module.exports = { createPaymentIntent, handleWebhook, getPayment };
