import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { error: Error | null }

/**
 * Catches render/runtime errors in child components so the user sees a message instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FitLife Pro] ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
          <div className="mx-auto max-w-lg rounded-2xl border border-rose-500/40 bg-rose-950/40 p-6 shadow-xl">
            <h1 className="text-xl font-bold text-rose-100">Something went wrong</h1>
            <p className="mt-2 text-sm text-rose-200/90">
              The app hit an unexpected error. Check the browser console for details.
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-900/80 p-3 text-xs text-slate-300">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="mt-6 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-orange-400"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
