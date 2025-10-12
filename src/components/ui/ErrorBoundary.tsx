import { Component, type ReactNode } from 'react'
import { errorContainer, errorTitle, errorMessage, errorButton } from './ErrorBoundary.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className={errorContainer}>
          <h2 className={errorTitle}>Something went wrong</h2>
          <p className={errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button type="button" className={errorButton} onClick={this.handleReset}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
