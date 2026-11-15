import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  User,
  Users,
  FilePlus,
  ClipboardList,
  GraduationCap,
  LogOut,
  Repeat,
  Cloud,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const handleRoleToggle = () => {
    const nextRole = role === 'faculty' ? 'student' : 'faculty';
    switchRole(nextRole);
    toast.info(`Switched role to ${nextRole === 'faculty' ? 'Faculty Admin' : 'Student'}`);
    navigate(nextRole === 'faculty' ? '/admin' : '/student');
  };

  // Nav configurations based on role
  const studentNavItems = [
    { label: 'Overview', to: '/student', icon: LayoutDashboard, exact: true },
    { label: 'My Assignments', to: '/student/assignments', icon: BookOpen },
    { label: 'My Submissions', to: '/student/submissions', icon: FileCheck2 },
    { label: 'Student Profile', to: '/student/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Admin Overview', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Manage Assignments', to: '/admin/assignments', icon: ClipboardList },
    { label: 'Create Assignment', to: '/admin/assignments/create', icon: FilePlus },
    { label: 'Manage Students', to: '/admin/students', icon: Users },
    { label: 'Review Submissions', to: '/admin/submissions', icon: FileCheck2 },
  ];

  const currentNavItems = role === 'faculty' ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900">CloudEdu</span>
              <span className="block text-[10px] text-brand-600 font-semibold tracking-wide uppercase">
                {role === 'faculty' ? 'Faculty Portal' : 'Student Portal'}
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Demo Quick Switch Bar */}
        <div className="p-4 mx-4 my-3 bg-brand-50/70 border border-brand-100 rounded-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-brand-900">Active View:</span>
            <span className="font-semibold text-brand-700 uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded border border-brand-200">
              {role === 'faculty' ? 'Faculty Admin' : 'Student'}
            </span>
          </div>
          <button
            onClick={handleRoleToggle}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-lg transition-colors shadow-subtle"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Switch to {role === 'faculty' ? 'Student' : 'Faculty'} View</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {role === 'faculty' ? 'Faculty Menu' : 'Student Menu'}
          </p>

          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
              </NavLink>
            );
          })}
        </div>

        {/* Architecture Badge */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Cloud className="w-4 h-4 text-brand-600 shrink-0" />
            <div className="truncate">
              <p className="font-semibold text-slate-800 truncate">AWS Serverless Ready</p>
              <p className="text-[11px] text-slate-500">Cognito • Lambda • DynamoDB</p>
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
