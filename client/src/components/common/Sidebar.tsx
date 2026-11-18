import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  FileText,
  UserCheck,
  Send,
  Calendar,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleBadgeStyle } from '../../utils/formatters';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Companies', path: '/admin/companies', icon: Building2 },
          { label: 'Coordinators', path: '/admin/coordinators', icon: UserCheck },
          { label: 'HR Accounts', path: '/admin/hr-accounts', icon: Briefcase },
          { label: 'Students', path: '/admin/students', icon: GraduationCap },
          { label: 'Applications', path: '/admin/applications', icon: FileText },
        ];
      case 'COORDINATOR':
        return [
          { label: 'Overview', path: '/coordinator/dashboard', icon: LayoutDashboard },
          { label: 'Students', path: '/coordinator/students', icon: GraduationCap },
          { label: 'Make Application', path: '/coordinator/make-application', icon: Send },
          { label: 'Applications', path: '/coordinator/applications', icon: FileText },
        ];
      case 'HR':
        return [
          { label: 'Overview', path: '/hr/dashboard', icon: LayoutDashboard },
          { label: 'Applicants', path: '/hr/applicants', icon: Users },
        ];
      case 'STUDENT':
        return [
          { label: 'My Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { label: 'My Applications', path: '/student/applications', icon: FileText },
          { label: 'Upcoming Drives', path: '/student/upcoming-companies', icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            CAMPUS PLACEMENT
          </h1>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Recruitment Portal
          </span>
        </div>
      </div>

      {/* User Role Badge */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.phone}</p>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${getRoleBadgeStyle(
              user?.role || ''
            )}`}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/40">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
