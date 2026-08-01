"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
  title?: string;
  showReset?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleReset}
          className={this.props.className}
          title={this.props.title}
          showReset={this.props.showReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
  title?: string;
  showReset?: boolean;
}

export function ErrorFallback({
  error,
  onRetry,
  className,
  title = "Something went wrong",
  showReset = true,
}: ErrorFallbackProps) {
  const message = getErrorMessage(error);

  return (
    <div
      className={cn(
        "flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-destructive/20">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-[320px] text-sm text-muted-foreground">
        {message}
      </p>
      {showReset && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-6 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to create a reset handler for error boundaries
 * Useful when you need to trigger a reset from outside the boundary
 */
export function useErrorBoundaryReset() {
  const [key, setKey] = React.useState(0);

  const reset = React.useCallback(() => {
    setKey((prev) => prev + 1);
  }, []);

  return { key, reset };
}
