import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[PulseChain ErrorBoundary Caught]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.removeItem('pulsechain_token');
    localStorage.removeItem('pulsechain_user');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#081F20] text-[#F4F0E8] font-sans">
          <div className="max-w-lg w-full rounded-xl bg-[#0D2C2E] border border-[#2A4849] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-[#133B3E] text-[#FFD400] border border-[#2A4849]">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F4F0E8]">Control Tower Recovery Mode</h2>
                <p className="text-xs text-[#C4D1CF] font-mono">
                  A client runtime exception was safely intercepted.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#081F20] border border-[#2A4849] text-xs font-mono text-[#FFD400] overflow-x-auto max-h-36">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#FFD400] text-[#081F20] font-bold text-xs uppercase tracking-wider hover:bg-[#e6bf00] transition-colors flex items-center justify-center space-x-2 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="py-2.5 px-4 rounded-xl bg-[#133B3E] border border-[#2A4849] text-[#F4F0E8] hover:text-[#FFD400] text-xs font-mono transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
