import { Component } from 'react'

export default class ChatAppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[Converly] A screen failed to render:', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f1f1ef', color: '#171717', fontFamily: 'system-ui, sans-serif' }}>
          <section style={{ width: 'min(100%, 460px)', padding: 28, border: '1px solid #deded9', borderRadius: 18, background: '#fff', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.06)' }}>
            <h1 style={{ margin: '0 0 10px', fontSize: 22 }}>This Converly screen could not load</h1>
            <p style={{ margin: '0 0 20px', color: '#666', lineHeight: 1.6 }}>Your account and messages have not been deleted. Reload the app to recover this screen. If it happens again, the browser console will contain the rendering error.</p>
            <button type="button" onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 10, padding: '11px 18px', background: '#171717', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Reload Converly</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
