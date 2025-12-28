import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import * as cacheManager_1 from 'cache-manager';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  // 1. CONSTRUCTOR - Initializes two Redis clients
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager_1.Cache,
  ) {
    // Create a separate ioredis client for advanced operations
    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      password: process.env.REDIS_PASSWORD,
      // Additional ioredis options:
      // retryStrategy: (times) => Math.min(times * 50, 2000),
      // maxRetriesPerRequest: 3,
      // enableReadyCheck: true,
    });
  }

  // 2. SIMPLE CACHE OPERATIONS (via CacheManager)

  // Get value from cache
  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  // Set value in cache with optional TTL
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  // Delete key from cache
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Clear entire cache
  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  // 3. DIRECT REDIS OPERATIONS (via ioredis)

  // Get the raw Redis client for custom operations
  getClient(): Redis {
    return this.redisClient;
  }

  // Get keys matching pattern (NOT available in CacheManager)
  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  // Publish to Redis channel (Pub/Sub)
  async publish(channel: string, message: string): Promise<number> {
    return this.redisClient.publish(channel, message);
  }

  // Subscribe to Redis channel (Pub/Sub)
  async subscribe(
    channel: string,
    callback: (message: string) => void,
  ): Promise<void> {
    await this.redisClient.subscribe(channel);
    this.redisClient.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(msg);
      }
    });
  }

  // 4. ADVANCED OPERATIONS EXAMPLES

  // Increment counter
  async incr(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  // Add to sorted set
  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.redisClient.zadd(key, score, member);
  }

  // Get from hash
  async hget(key: string, field: string): Promise<string | null> {
    return this.redisClient.hget(key, field);
  }

  // Check if key exists
  async exists(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }

  // Set with expiration
  async setex(key: string, ttl: number, value: string): Promise<string> {
    return this.redisClient.setex(key, ttl, value);
  }
}
