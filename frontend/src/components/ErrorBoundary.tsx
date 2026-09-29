import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error captured by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--gray-50, #f8fafc)',
          padding: '2rem',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
          color: 'var(--navy-900, #0f172a)'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
            border: '1px solid var(--gray-200, #e2e8f0)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--danger-light, #fee2e2)',
              color: 'var(--danger, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              border: '1px solid var(--danger-border, #fecaca)'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: 'var(--navy-900, #0f172a)'
            }}>
              Something went wrong
            </h1>

            <p style={{
              fontSize: '0.95rem',
              color: 'var(--gray-500, #64748b)',
              lineHeight: 1.6,
              marginBottom: '1.75rem'
            }}>
              The application encountered an unexpected runtime error. You can refresh the page or return to the home screen.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: 'var(--gray-50, #f8fafc)',
                border: '1px solid var(--gray-200, #e2e8f0)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.8rem',
                color: 'var(--danger, #dc2626)',
                fontFamily: 'monospace',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.75rem'
              }}>
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary, #2563eb)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--gray-100, #f1f5f9)',
                  color: 'var(--navy-800, #1e293b)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: '1px solid var(--gray-300, #cbd5e1)',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} /> Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
