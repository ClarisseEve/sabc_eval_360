#!/usr/bin/env node

import { spawn } from 'node:child_process';
import process from 'node:process';
import { RedisMemoryServer } from 'redis-memory-server';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node ./scripts/with-ephemeral-redis.mjs <command> [args...]');
  process.exit(1);
}

let redisServer;
let child;
let childExited = false;

const shutdown = async (code = 0) => {
  if (child && !childExited && !child.killed) {
    child.kill('SIGTERM');
  }

  if (redisServer) {
    try {
      await redisServer.stop();
    } catch (error) {
      console.error('Failed to stop ephemeral redis:', error);
    }
  }

  process.exit(code);
};

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

try {
  redisServer = await RedisMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
    },
    binary: {
      version: process.env.REDISMS_VERSION || 'stable',
    },
  });

  const host = await redisServer.getHost();
  const port = await redisServer.getPort();
  const redisUrl = `redis://${host}:${port}`;

  console.log(`Ephemeral Redis ready on ${redisUrl}`);

  child = spawn(args[0], args.slice(1), {
    stdio: 'inherit',
    env: {
      ...process.env,
      CACHE_DRIVER: 'redis',
      REDIS_URL: redisUrl,
    },
  });

  child.on('exit', async (code, signal) => {
    childExited = true;

    if (signal) {
      console.error(`Child terminated by signal ${signal}`);
      await shutdown(1);
      return;
    }

    await shutdown(code ?? 0);
  });
} catch (error) {
  console.error('Failed to start ephemeral Redis:', error);
  await shutdown(1);
}
