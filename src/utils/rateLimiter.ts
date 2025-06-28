export class RateLimiter {
  private requests: Map<string, number[]>;
  private limit: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(limit: number, windowMs: number) {
    this.requests = new Map();
    this.limit = limit;
    this.windowMs = windowMs;
    
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  tryRequest(key: string): boolean {
    if (!key || typeof key !== 'string') {
      return false;
    }
    
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
    if (!key || typeof key !== 'string') {
      return;
    }
    this.requests.delete(key);
  }
  
  private cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}