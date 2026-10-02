import { Component } from 'react';

// Clean "something went wrong" page instead of a blank screen when a render
// crashes. Details go to the console only, never to the customer.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[app] render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-4 text-center">
        <img src="/logo.png" alt="Nora Hair Line" width="120" height="108" className="mb-6 rounded-2xl bg-burgundy-500 p-3" />
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-burgundy-600 mb-3">Something went wrong</h1>
        <p className="text-gray-500 max-w-sm mb-8">
          Sorry, this page hit a problem. Please refresh, or chat with us on WhatsApp and we'll help you order.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">Refresh page</button>
          <a href="/" className="btn-outline">Back to Home</a>
        </div>
      </div>
    );
  }
}
