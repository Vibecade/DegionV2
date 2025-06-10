interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
  url: string;
  userAgent: string;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  logError(error: Error, context?: string, additionalData?: any): void {
    const errorContext: ErrorContext = {
      component: context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...additionalData
    };

    this.errorQueue.push({ error, context: errorContext });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;

    this.isProcessing = true;

    try {
      const batch = this.errorQueue.splice(0, 10); // Process in batches
      
      // In production, send to error reporting service
      if (import.meta.env.PROD) {
        // await this.sendToErrorService(batch);
      }
      
      // Log to console in development
      if (import.meta.env.DEV) {
        batch.forEach(({ error, context }) => {
          console.group(`🚨 Error in ${context.component || 'Unknown'}`);
          console.error('Error:', error);
          console.table(context);
          console.groupEnd();
        });
      }
    } catch (err) {
      console.error('Failed to process error queue:', err);
    } finally {
      this.isProcessing = false;
      
      // Process remaining items
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private async sendToErrorService(errors: Array<{ error: Error; context: ErrorContext }>): Promise<void> {
    // Implementation for sending errors to external service
    // e.g., Sentry, LogRocket, etc.
  }
}

const errorLogger = ErrorLogger.getInstance();

export const logError = (error: Error, context?: string, additionalData?: any) => {
  errorLogger.logError(error, context || 'General', additionalData);
};