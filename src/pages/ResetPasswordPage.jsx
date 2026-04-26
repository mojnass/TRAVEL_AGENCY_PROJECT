import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const initialToken = params.get('token') || '';
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword, completePasswordReset } = useAuth();

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      setToken(result.token || '');
      setMessage(`Reset email queued. Test reset link: ${result.resetLink}`);
    } catch (err) {
      setError(err.message || 'Reset request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const completeReset = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await completePasswordReset(token, password);
      setMessage('Password updated. Old sessions are now invalid; please log in again.');
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-600">Request a reset link, then set a new password.</p>

        {error && (
          <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 flex gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="break-words">{message}</span>
          </div>
        )}

        {!token ? (
          <form onSubmit={requestReset} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </label>
            <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </button>
          </form>
        ) : (
          <form onSubmit={completeReset} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Reset token
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              New password
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </label>
            <button disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </form>
        )}

        <Link to="/login" className="mt-5 block text-center text-sm font-medium text-blue-600">
          Back to login
        </Link>
      </div>
    </div>
  );
};
