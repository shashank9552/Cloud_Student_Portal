import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Cloud,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { awsConfig } from '../../services/awsConfig';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(null);

  const { login, isCognitoConfigured } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected from a protected route, preserve destination
  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnconfirmedEmail(null);

    if (!email.trim() || !password) {
      setError('Please provide your academic email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      toast.success(`Authenticated successfully as ${loggedUser.name}!`);

      // Determine redirect path from verified role
      if (from) {
        navigate(from, { replace: true });
      } else {
        const targetPath = loggedUser.role === 'faculty' ? '/admin/dashboard' : '/student/dashboard';
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      console.error('[Login failure]:', err);

      if (err.name === 'UserNotConfirmedException' || err.message?.includes('not verified')) {
        setError('Your email has not been verified yet. Please confirm your email with the 6-digit code sent to your inbox.');
        setUnconfirmedEmail(email.trim().toLowerCase());
      } else if (err.name === 'NotAuthorizedException' || err.message?.includes('Incorrect username or password')) {
        setError('Incorrect email or password. Please verify your credentials and try again.');
      } else if (err.name === 'UserNotFoundException') {
        setError('No account exists with this email address. Please register a student account.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill helper for development / mock evaluation only
  const fillMockCredentials = (role) => {
    if (role === 'student') {
      setEmail('student@cloudedu.ac.in');
      setPassword('password123');
    } else {
      setEmail('faculty@cloudedu.ac.in');
      setPassword('password123');
    }
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to CloudEdu Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Amazon Cognito Authenticated Academic Gateway
          </p>
        </div>

        {/* AWS Cognito Environment Status Banner */}
        {isCognitoConfigured ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2.5 shadow-subtle">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Amazon Cognito Connected:</span> Region{' '}
              <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-[11px] font-mono">
                {awsConfig.region}
              </code>
              . Roles are securely derived from JWT claims.
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shadow-subtle">
            <div className="flex items-center gap-2 mb-1.5 font-bold">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Development Mode (Cognito Not Configured)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed mb-3">
              To connect real AWS Cognito, supply <code>VITE_COGNITO_USER_POOL_ID</code> and{' '}
              <code>VITE_COGNITO_CLIENT_ID</code> in <code>.env</code>. You can test locally using demo credentials below:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillMockCredentials('student')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-subtle transition-all"
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Student Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillMockCredentials('faculty')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-subtle transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Faculty Demo</span>
              </button>
            </div>
          </div>
        )}

        {/* Login Card */}
        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {unconfirmedEmail && (
                  <div className="pt-2 border-t border-rose-200 flex justify-end">
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline"
                    >
                      <span>Enter verification code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Email */}
            <Input
              label="Academic Email Address"
              type="email"
              icon={Mail}
              placeholder="e.g. student@cloudedu.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In with Cognito
            </Button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Register as Student
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
