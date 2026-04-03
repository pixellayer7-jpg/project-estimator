import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-inner">
            <h1 className="error-boundary-title">Something went wrong</h1>
            <p className="error-boundary-text">页面出现异常，请刷新后重试。</p>
            <button
              type="button"
              className="btn btn-primary error-boundary-reload"
              onClick={() => window.location.reload()}
            >
              Reload / 刷新
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
