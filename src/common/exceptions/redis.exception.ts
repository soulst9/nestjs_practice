export class RedisConnectionFailedException extends Error {
  constructor() {
    super('Redis connection permanently failed after maximum retry attempts');
    this.name = 'RedisConnectionFailedException';
  }
}

