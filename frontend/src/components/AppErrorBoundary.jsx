import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Application render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-cyber-bg p-6 text-cyber-text">
          <section className="w-full max-w-2xl rounded-xl border border-red-500/30 bg-red-950/20 p-6">
            <h1 className="text-xl font-bold text-white">Unable to load CipherUnit</h1>
            <p className="mt-2 text-sm text-red-300">{this.state.error.message || 'An unexpected interface error occurred.'}</p>
            <button
              className="mt-5 rounded-lg bg-cyber-primary px-4 py-2 text-sm font-semibold text-black"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
