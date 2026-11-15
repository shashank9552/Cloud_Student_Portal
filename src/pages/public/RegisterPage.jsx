import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Hash, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const RegisterPage = () => {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const newUser = await register(formData);
      toast.success(`Account registered successfully! Welcome, ${newUser.name}.`);
      navigate('/student');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
      toast.error('Registration failed');
    } finally {
      setLoading(false);
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
            Student Enrollment Registration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create your account to submit assignments and track academic progress
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
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
              Complete Registration & Enter Portal
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have a registered account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
