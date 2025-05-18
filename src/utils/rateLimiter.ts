export class RateLimiter {
  private requests: Map<string, number[]>;
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  tryRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let requests = this.requests.get(key) || [];

    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if we're at the limit
    if (requests.length >= this.limit) {
      return false;
    }

    // Add new request
    requests.push(now);
    this.requests.set(key, requests);

    return true;
  }

  clear(key: string): void {
    this.requests.delete(key);
  }
}