import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createApp } from './app';
import { logger } from './utils/logger';
import { createWsServer } from './ws/wsServer';

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/realtime_chat';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');

    const app = createApp();
    const server = http.createServer(app);

    createWsServer(server);

    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

start();


