import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "../i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Error caught by boundary:", error, info);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-40 items-center justify-center rounded bg-gray-700 text-xs text-gray-400">
            {i18n.t("error.boundary.chartFailed")}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
