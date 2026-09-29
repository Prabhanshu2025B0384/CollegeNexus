import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ username: username.trim(), password: password.trim() });
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Invalid username or password. Please verify credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card card">
        <div className="login-card-header">
          <div className="login-shield-wrap">
            <Shield size={28} className="shield-icon" />
          </div>
          <h2 className="login-title">Club Admin Portal</h2>
          <p className="login-subtitle">
            Sign in with authorized administrative credentials to manage club events and registrations.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} className="alert-icon" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Admin Username</label>
            <div className="input-with-icon">
              <User size={18} className="field-icon" />
              <input
                type="text"
                className="form-input icon-padded"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="field-icon" />
              <input
                type="password"
                className="form-input icon-padded"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg full-width-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="pulse" />
                Authenticating...
              </>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          {import.meta.env.DEV && (
            <div className="demo-credentials-note">
              <span className="demo-badge">Local Development Credentials</span>
              <code>Username: admin &nbsp;|&nbsp; Password: Admin@12345</code>
              <small>Configurable via ADMIN_USERNAME & ADMIN_PASSWORD environment variables</small>
            </div>
          )}

          <Link to="/" className="back-to-site-link">
            <ArrowLeft size={14} /> Back to Student Site
          </Link>
        </div>
      </div>

      <style>{`
        .login-page-wrapper {
          min-height: calc(100vh - 160px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3.5rem 1.5rem;
          background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-50) 100%);
        }

        .login-card {
          max-width: 460px;
          width: 100%;
          padding: 3rem 2.25rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          background: #ffffff;
        }

        .login-card-header {
          text-align: center;
          margin-bottom: 2.25rem;
        }

        .login-shield-wrap {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          background-color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.35rem;
          border: 1px solid var(--primary-border);
          box-shadow: var(--shadow-sm);
        }

        .shield-icon {
          color: var(--primary);
        }

        .login-title {
          font-size: 1.65rem;
          color: var(--navy-900);
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          font-size: 0.9rem;
          color: var(--gray-500);
          line-height: 1.55;
        }

        .login-form {
          margin-bottom: 2rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .field-icon {
          position: absolute;
          left: 0.95rem;
          color: var(--gray-400);
          pointer-events: none;
        }

        .icon-padded {
          padding-left: 2.75rem;
        }

        .full-width-btn {
          width: 100%;
          margin-top: 0.75rem;
        }

        .login-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding-top: 1.75rem;
          border-top: 1px solid var(--gray-200);
        }

        .demo-credentials-note {
          background-color: var(--gray-50);
          border: 1px dashed var(--gray-300);
          border-radius: var(--radius-md);
          padding: 0.85rem 1rem;
          font-size: 0.8rem;
          color: var(--gray-600);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          width: 100%;
          text-align: center;
        }

        .demo-badge {
          font-weight: 700;
          color: var(--navy-800);
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.04em;
        }

        .demo-credentials-note code {
          background: #ffffff;
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--gray-200);
          color: var(--primary);
          font-weight: 600;
        }

        .back-to-site-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.875rem;
          color: var(--gray-500);
          font-weight: 600;
        }

        .back-to-site-link:hover {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
};
