export const logError = (error: Error, context?: string) => {
  // In production, you would send this to a logging service
  console.error(`[${context || 'General'}]`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
};