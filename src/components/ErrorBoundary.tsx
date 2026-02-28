import React, { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-bg-primary p-4">
            <div className="max-w-md w-full bg-bg-secondary border border-error/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-error/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <h2 className="text-sm font-bold text-text-primary">오류가 발생했습니다</h2>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                예기치 않은 오류로 인해 이 기능을 사용할 수 없습니다.
                아래 버튼을 눌러 재시도하거나, 페이지를 새로고침해주세요.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-bg-primary/80 rounded-lg p-3 text-[10px] text-text-muted font-mono overflow-auto max-h-32 border border-border">
                  <p className="font-semibold text-error mb-1">오류 메시지:</p>
                  <p>{this.state.error.message}</p>
                </div>
              )}

              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-dim transition active:scale-95"
              >
                다시 시도
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
