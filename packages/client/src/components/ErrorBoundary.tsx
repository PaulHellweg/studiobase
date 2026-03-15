import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
    // Future: forward to error reporting service (e.g. Sentry)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg, #0f0f0f)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: "400px",
              width: "100%",
              background: "var(--surface, #1a1a1a)",
              border: "1px solid var(--border, #2a2a2a)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            {/* Error icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="#ef4444"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--text, #ffffff)",
                marginBottom: "0.5rem",
              }}
            >
              Etwas ist schiefgelaufen
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text2, #888)",
                marginBottom: "1.5rem",
              }}
            >
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
            </p>

            <button
              onClick={this.handleRetry}
              style={{
                background: "var(--accent, #6366f1)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "0.625rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
