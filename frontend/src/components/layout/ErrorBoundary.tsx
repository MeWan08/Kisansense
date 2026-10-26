import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "../../lib/i18n";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <main className="error-page">
          <h1>{i18n.t("errorTitle")}</h1>
          <p>{i18n.t("errorBody")}</p>
          <button
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            {i18n.t("reload")}
          </button>
        </main>
      );
    return this.props.children;
  }
}
