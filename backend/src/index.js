require('dotenv').config();
require('./utils/checkEnv')();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./utils/socket');
const logger = require('./utils/logger');
const { expireStaleBookingsSafe } = require('./services/bookingExpiry.service');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`Amana API running on port ${PORT} [${process.env.NODE_ENV}]`);
  expireStaleBookingsSafe();
  setInterval(expireStaleBookingsSafe, 15 * 60 * 1000);
});
