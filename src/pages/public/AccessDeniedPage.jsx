import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export const AccessDeniedPage = ({ requiredRole = 'FACULTY' }) => {
  const { user, role, groups, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate(role === 'faculty' ? '/admin' : '/student', { replace: true });
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card padding="p-8" className="max-w-lg w-full text-center shadow-xl border-rose-200">
        {/* Shield Alert Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-700 mb-3">
          <Lock className="w-3.5 h-3.5" />
          403 Forbidden • Access Denied
        </span>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Unauthorized Portal Access
        </h2>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          You do not have the required Amazon Cognito group permissions to access this administrative route.
        </p>

        {/* Security Credentials Summary */}
        <div className="my-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Authenticated Identity:</span>
            <span className="font-semibold text-slate-800">{user?.email || 'Unknown User'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Active Cognito Groups:</span>
            <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
              {groups && groups.length > 0 ? groups.join(', ') : 'STUDENT (Default)'}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Required Cognito Privilege:</span>
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {requiredRole.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs mb-6 text-left flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>RBAC Enforcement Rule:</strong> Faculty administrative privileges cannot be self-assigned. An AWS Administrator must assign your account to the <code>FACULTY</code> Cognito group via AWS Management Console or AWS CLI.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={handleReturn}
            icon={ArrowLeft}
            className="w-full sm:w-auto"
          >
            Return to {role === 'faculty' ? 'Faculty Admin' : 'Student'} Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={handleSignOut}
            icon={LogOut}
            className="w-full sm:w-auto"
          >
            Switch Account
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;
