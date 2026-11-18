import React, { useState, useEffect } from 'react';
import {
  Building2,
  KeyRound,
  LogOut,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import api from '../../services/api';
import { Company } from '../../types';

interface HeaderProps {
  selectedCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ selectedCompanyId, onCompanyChange }) => {
  const { user, logout } = useAuth();
  const { success, error } = useToast();

  const [hrCompanies, setHrCompanies] = useState<Company[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Fetch HR's assigned companies if user is HR
  useEffect(() => {
    if (user?.role === 'HR') {
      api
        .get('/hr/my-companies')
        .then((res) => {
          if (res.data.success) {
            setHrCompanies(res.data.companies || []);
            // Default to first company if none selected yet
            if (
              !selectedCompanyId &&
              res.data.companies.length > 0 &&
              onCompanyChange
            ) {
              onCompanyChange(res.data.companies[0]._id);
            }
          }
        })
        .catch(console.error);
    }
  }, [user?.role, selectedCompanyId, onCompanyChange]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        success('Password updated successfully!');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left side: Context or Company Selector */}
      <div className="flex items-center gap-4">
        {user?.role === 'HR' && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Company:
            </span>
            {hrCompanies.length > 1 ? (
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {hrCompanies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : hrCompanies.length === 1 ? (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                {hrCompanies[0].name}
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-medium">
                No company assigned
              </span>
            )}
          </div>
        )}

        {user?.role !== 'HR' && (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authenticated as <strong className="text-slate-800">{user?.role}</strong></span>
          </div>
        )}
      </div>

      {/* Right side: Profile & Actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-xs">
              <p className="font-semibold text-slate-800 leading-none">{user?.name}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user?.email}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in-50"
              onClick={() => setIsProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-400" />
                <span>Change Password</span>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        description="Update your account password for enhanced security"
        maxWidth="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Re-enter new password"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmittingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
