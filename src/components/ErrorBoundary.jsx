import { Component } from "react";

/**
 * ErrorBoundary — cattura errori di rendering nei figli
 * e mostra un fallback invece di far crashare tutta l'app.
 * Uso: <ErrorBoundary><ComponenteInstabile /></ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: "24px 20px",
            margin: "12px 0",
            background: "var(--nx-surface)",
            border: "1px solid var(--nx-border)",
            borderRadius: "var(--nx-radius-lg)",
            textAlign: "center",
          }}
        >
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%",
            background: "rgba(239,68,68,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 12px"
          }}>
            <svg width="20" height="20" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--nx-text)", marginBottom: "6px" }}>
            Qualcosa è andato storto
          </p>
          <p style={{ fontSize: "12px", color: "var(--nx-text-muted)", marginBottom: "16px" }}>
            Questo componente non è riuscito a caricarsi.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "7px 20px", borderRadius: "var(--nx-radius-full)",
              background: "var(--nx-grad-btn)", border: "none",
              color: "#fff", fontWeight: 600, fontSize: "13px", cursor: "pointer"
            }}
          >
            Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}