import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Hash,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const RegisterPage = () => {
  // Step: 'REGISTER' | 'VERIFY'
  const [step, setStep] = useState('REGISTER');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    program: 'Master of Computer Applications (MCA)',
    department: 'Department of Computer Science & Engineering',
    semester: 'Semester 4',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, confirmRegistration, resendCode, isCognitoConfigured } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(pwd)) return 'Password must include at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(pwd)) return 'Password must include at least one number (0-9).';
    if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must include at least one special character (!@#$%^&*).';
    return null;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.rollNumber.trim()) {
      setError('Please fill in all mandatory profile fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);
    try {
      const result = await register(formData);
      setPendingEmail(formData.email.trim().toLowerCase());
      setStep('VERIFY');
      toast.success('Registration initiated! Please enter the verification code sent to your email.');
    } catch (err) {
      console.error('[Registration error]:', err);
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email address already exists. Please sign in or use a different email.');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not conform to AWS Cognito policy (min 8 chars, uppercase, lowercase, number, symbol).');
      } else {
        setError(err.message || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!verificationCode.trim()) {
      setError('Please enter the 6-digit confirmation code from your email.');
      return;
    }

    setLoading(true);
    try {
      await confirmRegistration(pendingEmail, verificationCode);
      toast.success('Email confirmed successfully! Your student account is now active.');
      navigate('/login');
    } catch (err) {
      console.error('[Verification error]:', err);
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code provided. Please check your inbox and try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please click "Resend Code" to receive a new one.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendCode(pendingEmail);
      toast.info('A new verification code has been dispatched to your email.');
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {step === 'REGISTER' ? 'Student Enrollment Registration' : 'Confirm Your Email'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {step === 'REGISTER'
              ? 'Enrolls you in the MCA student directory with verified Amazon Cognito identity'
              : `Enter the verification code sent to ${pendingEmail}`}
          </p>
        </div>

        {/* Cloud Architecture Notice */}
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">AWS Cognito RBAC Security Rule:</span> Public registration strictly creates a <code>STUDENT</code> account. Faculty administrator privileges cannot be self-selected and must be provisioned by an AWS Cloud Administrator.
          </div>
        </div>

        {/* STEP 1: Registration Form */}
        {step === 'REGISTER' && (
          <Card className="shadow-lg">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="fullName"
                  icon={User}
                  placeholder="e.g. Aarav Patel"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="University Roll No"
                  name="rollNumber"
                  icon={Hash}
                  placeholder="e.g. MCA2024042"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Academic Email"
                  name="email"
                  type="email"
                  icon={Mail}
                  placeholder="e.g. student@cloudedu.ac.in"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Contact Phone"
                  name="phone"
                  icon={Phone}
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Academic Program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  options={[
                    { value: 'Master of Computer Applications (MCA)', label: 'MCA (Computer Applications)' },
                    { value: 'M.Tech Computer Science & Engineering', label: 'M.Tech CSE' },
                    { value: 'B.Tech Computer Science', label: 'B.Tech CSE' },
                  ]}
                />

                <Select
                  label="Current Semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  options={[
                    { value: 'Semester 1', label: 'Semester 1' },
                    { value: 'Semester 2', label: 'Semester 2' },
                    { value: 'Semester 3', label: 'Semester 3' },
                    { value: 'Semester 4', label: 'Semester 4' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol"
                />

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  icon={Lock}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full mt-3"
                icon={ArrowRight}
                iconPosition="right"
              >
                Register & Request Email Verification
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Already have an account?</span>
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    const promptEmail = prompt('Enter your registered email address to verify:');
                    if (promptEmail) {
                      setPendingEmail(promptEmail.trim());
                      setStep('VERIFY');
                    }
                  }}
                  className="font-semibold text-slate-700 hover:text-brand-600"
                >
                  Confirm Code
                </button>
                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                  Sign In
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: Email Verification Screen */}
        {step === 'VERIFY' && (
          <Card className="shadow-lg">
            <form onSubmit={handleVerifySubmit} className="space-y-5">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Enter Verification Code</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Amazon Cognito has sent a one-time 6-digit confirmation code to:
                </p>
                <p className="text-xs font-semibold text-brand-700 mt-0.5">{pendingEmail}</p>
                {!isCognitoConfigured && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
                    <strong>Local Mock Notice:</strong> User Pool is not configured yet. Enter <code>123456</code> to simulate email confirmation.
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <Input
                  label="6-Digit Confirmation Code"
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="text-center text-lg tracking-widest font-mono"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full"
                icon={CheckCircle2}
              >
                Confirm Email & Activate Account
              </Button>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStep('REGISTER')}
                  className="text-slate-500 hover:text-slate-800"
                >
                  ← Back to registration
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className="text-brand-600 font-semibold hover:text-brand-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
