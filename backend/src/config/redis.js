import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { config } from './index.js';

let redisClient = null;

function createMockRedis(reason) {
  logger.warn(`⚠️  Using mock Redis client: ${reason}`);

  return {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    ping: async () => 'PONG',
    quit: async () => 'OK',
    connected: false,
    isMock: true
  };
}

export async function initRedis() {
  if (redisClient) return redisClient;

  if (config.isDevelopment) {
    redisClient = createMockRedis('local development mode');
    return redisClient;
  }

  const host = config.redis.host;
  if (!host || host.includes('your-redis-host')) {
    redisClient = createMockRedis('REDIS_HOST is not configured');
    return redisClient;
  }

  try {
    const client = new Redis({
      host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      connectTimeout: 3000,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      tls: config.redis.tls
        ? {
            rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false'
          }
        : undefined
    });

    client.on('connect', () => logger.info('✅ Redis connected'));
    client.on('error', (error) => logger.error('Redis error:', error.message));

    await client.connect();
    await client.ping();

    redisClient = client;
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection failed, falling back to mock client:', error.message);
    redisClient = createMockRedis('connection failed');
    return redisClient;
  }

}

export default { initRedis };
