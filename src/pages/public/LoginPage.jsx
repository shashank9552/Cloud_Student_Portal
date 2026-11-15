import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ShieldCheck, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const LoginPage = () => {
  const [email, setEmail] = useState('student@cloudedu.ac.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('student'); // 'student' | 'faculty'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email, password, role);
      toast.success(`Welcome back, ${loggedUser.name}!`);
      navigate(loggedUser.role === 'faculty' ? '/admin' : '/student');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (targetRole) => {
    setRole(targetRole);
    if (targetRole === 'student') {
      setEmail('student@cloudedu.ac.in');
      setPassword('studentPass123');
    } else {
      setEmail('faculty@cloudedu.ac.in');
      setPassword('facultyPass123');
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
            Access your student submissions or faculty administration console
          </p>
        </div>

        {/* Demo Accounts Quick-Fill Box (Great for portfolio reviewers!) */}
        <div className="bg-brand-50/70 border border-brand-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
              1-Click Demo Showcase
            </span>
          </div>
          <p className="text-xs text-brand-700 mb-3">
            Click below to autofill pre-configured demo credentials:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('student')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                role === 'student'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Student Demo</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('faculty')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                role === 'faculty'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Faculty Admin</span>
            </button>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Role Radio Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Portal Role
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    role === 'student'
                      ? 'bg-white text-slate-900 shadow-subtle'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                    role === 'faculty'
                      ? 'bg-white text-slate-900 shadow-subtle'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Faculty / Admin
                </button>
              </div>
            </div>

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="e.g. student@cloudedu.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              Sign In to {role === 'faculty' ? 'Faculty Admin' : 'Student Dashboard'}
            </Button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an enrolled student account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
