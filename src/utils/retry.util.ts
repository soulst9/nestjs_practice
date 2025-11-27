import { Injectable } from "@nestjs/common";

@Injectable()
export class RetryUtil {
  constructor() {}

  async retry<T>(fn: () => Promise<T>, maxAttempts: number, delay: number): Promise<T> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
      }
    }
    throw new Error(`Failed after ${maxAttempts} attempts`);
  }
}