import { Component, type ErrorInfo, type ReactNode } from "react";
import i18n from "../i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Error caught by boundary:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h1 className="mb-2 text-xl font-semibold">
              {i18n.t("error.boundary.title")}
            </h1>
            <p className="mb-4 text-gray-400">
              {i18n.t("error.boundary.description")}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
            >
              {i18n.t("error.boundary.reload")}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
