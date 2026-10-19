const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join a room per booking to receive chat/tracking updates.
    // Only the sender or the traveler on that booking may join.
    socket.on('join:booking', async (bookingId) => {
      try {
        if (!bookingId) return;
        const token = socket.handshake.auth?.token;
        if (!token) return;

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Required here (not at module scope) to avoid a require cycle with prisma.js
        const prisma = require('./prisma');
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { senderId: true, payerId: true, status: true, trip: { select: { travelerId: true } } },
        });
        if (!booking) return;
        const allowed = [booking.senderId, booking.payerId, booking.trip.travelerId].includes(decoded.userId);
        if (!allowed || (booking.status === 'PAYMENT_PENDING' && decoded.userId === booking.trip.travelerId)) {
          return;
        }

        socket.join(`booking:${bookingId}`);
      } catch (err) {
        logger.warn('Rejected join:booking', { error: err.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIo };
