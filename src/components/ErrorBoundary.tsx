import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError () {
    return { hasError: true }
  }

  render () {
    if (this.state.hasError) {
      return (
        <main className='fatal-error'>
          <p className='page-kicker'>Something went wrong</p>
          <h1>Your saved plan is still on this phone.</h1>
          <button onClick={reloadPage} type='button'>Reload app</button>
        </main>
      )
    }
    return this.props.children
  }
}

function reloadPage () {
  globalThis.location.reload()
}
