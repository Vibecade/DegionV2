import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg text-cyber-text p-4">
      <div className="glass-panel p-6 rounded-lg max-w-lg w-full space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-bold font-orbitron">Something went wrong</h2>
        </div>
        <p className="text-gray-400">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="btn-primary w-full"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
}