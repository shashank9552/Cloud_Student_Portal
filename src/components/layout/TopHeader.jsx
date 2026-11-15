import React from 'react';
import { Menu, Bell, ShieldCheck, Database, HardDrive, Terminal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import awsConfig from '../../services/awsConfig';

export const TopHeader = ({ onMenuClick }) => {
  const { user, role } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {role === 'faculty' ? 'Faculty Admin Panel' : 'Student Academic Portal'}
          </span>
          <h2 className="text-sm font-bold text-slate-800">
            {role === 'faculty' ? 'Department of Computer Science & Engineering' : user?.program || 'MCA Semester 4'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Architecture Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              awsConfig.cognito.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          ></span>
          <span className="font-semibold text-slate-700">Cognito Auth:</span>
          <span className="text-slate-500">
            {awsConfig.cognito.isConfigured ? `Active (${awsConfig.region})` : 'Dev Simulation'}
          </span>
        </div>

        {/* Quick notification icon */}
        <div className="relative">
          <button
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-600 rounded-full"></span>
          </button>
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User avatar'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <span className="text-xs font-semibold text-slate-700 hidden md:inline-block">
            {user?.name?.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
