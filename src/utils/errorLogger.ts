export const logError = (error: Error, context?: string, additionalData?: any) => {
  errorReporting.logError(error, context || 'General', additionalData);
};