import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleQuickFill = (email: string, pass: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const loggedUser = await login(identifier, password);
      success(`Welcome back, ${loggedUser.name}!`);

      // Redirect according to role
      switch (loggedUser.role) {
        case 'ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'COORDINATOR':
          navigate('/coordinator/dashboard', { replace: true });
          break;
        case 'HR':
          navigate('/hr/dashboard', { replace: true });
          break;
        case 'STUDENT':
          navigate('/student/dashboard', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Portal Emblem */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-8 h-8" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Campus Recruitment Portal
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sign in to access your placement dashboard and applications
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email, Phone or Roll Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@placement.edu / 9999999999"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Bar for Evaluators */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Demo Logins (Click to Autofill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleRoleQuickFill('admin@placement.edu', 'AdminPassword123!')}
                className="p-2 text-left rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 transition-colors"
              >
                <div className="font-bold text-purple-900">Admin</div>
                <div className="text-[10px] text-purple-700 truncate">admin@placement.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleQuickFill('coordinator@placement.edu', 'Coordinator123!')}
                className="p-2 text-left rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 transition-colors"
              >
                <div className="font-bold text-indigo-900">Coordinator</div>
                <div className="text-[10px] text-indigo-700 truncate">coordinator@placement.edu</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleQuickFill('hr@infosys.com', 'HrPassword123!')}
                className="p-2 text-left rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 transition-colors"
              >
                <div className="font-bold text-teal-900">HR / Company</div>
                <div className="text-[10px] text-teal-700 truncate">hr@infosys.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleQuickFill('aarav.patel@student.edu', 'Student123!')}
                className="p-2 text-left rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100/60 transition-colors"
              >
                <div className="font-bold text-blue-900">Student</div>
                <div className="text-[10px] text-blue-700 truncate">aarav.patel@student.edu</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Authorized university placement operations &middot; Antigravity MVP
          </p>
        </div>
      </div>
    </div>
  );
};
