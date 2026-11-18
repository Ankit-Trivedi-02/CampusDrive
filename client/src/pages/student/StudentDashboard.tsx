import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  FileText,
  Clock,
  UserCheck,
  CheckCircle,
  Calendar,
  ArrowRight,
  User,
  Phone,
  Mail,
  Award,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  getStatusBadgeStyle,
  formatStatusLabel,
} from '../../utils/formatters';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { error } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        const [dashRes, appsRes] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/my-applications'),
        ]);

        if (dashRes.data.success) {
          setProfile(dashRes.data.profile);
          setStats(dashRes.data.stats);
        }
        if (appsRes.data.success) {
          setApplications(appsRes.data.applications || []);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load student dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Selected applications for high-visibility outcome banner (from PDF reference)
  const selectedOffer = applications.find((a) => a.status === 'SELECTED');

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Campus Placement Season</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {profile?.name || user?.name}!
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
            Track your recruitment applications, monitor interview schedules, and inspect employer feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/student/applications"
            className="px-4 py-2 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl shadow-xs transition-colors"
          >
            My Applications
          </Link>
          <Link
            to="/student/upcoming-companies"
            className="px-4 py-2 text-xs font-bold text-white bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-xs transition-colors"
          >
            Browse Drives
          </Link>
        </div>
      </div>

      {/* Selected Offer Celebration Box (If Selected) */}
      {selectedOffer && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-100">
                Placement Result Declared
              </span>
              <h3 className="text-xl font-bold mt-0.5">
                Congratulations! Selected at {selectedOffer.company?.name}
              </h3>
              {selectedOffer.ctc && (
                <p className="text-emerald-100 text-xs mt-1">
                  Offered Package:{' '}
                  <strong className="text-white text-sm font-bold">
                    {selectedOffer.ctc}
                  </strong>
                </p>
              )}
            </div>
          </div>
          <Link
            to="/student/applications"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-950 bg-white rounded-xl shadow-xs hover:bg-emerald-50 transition-colors"
          >
            <span>View Offer Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Companies Applied"
          value={stats?.totalApplied || 0}
          icon={Building2}
          iconColor="text-blue-600 bg-blue-50 border-blue-100"
          subtext="Placement drives applied to"
        />
        <StatCard
          title="Under Review"
          value={stats?.underReview || 0}
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50 border-amber-100"
          subtext="Applications in initial screening"
        />
        <StatCard
          title="Shortlisted & Interviews"
          value={stats?.shortlisted || 0}
          icon={UserCheck}
          iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
          subtext="Shortlisted for technical rounds"
        />
        <StatCard
          title="Selected Offers"
          value={stats?.selected || 0}
          icon={CheckCircle}
          iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
          subtext="Confirmed placement offers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Dossier Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                My Academic Profile
              </h3>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                Student
              </span>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Full Name
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {profile?.name || user?.name}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Roll Number
                </span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                  {profile?.rollNumber || user?.rollNumber || 'Not assigned'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Course
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profile?.course || user?.course || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Semester
                  </span>
                  <span className="font-semibold text-slate-800">
                    {profile?.semester || user?.semester || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Branch / Specialization
                </span>
                <span className="font-semibold text-slate-800">
                  {profile?.branch || user?.branch || '—'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.email || user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile?.phone || user?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            For profile modifications, please contact your faculty placement coordinator.
          </div>
        </div>

        {/* Recent Applications Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Recent Applications & Interview Status
              </h3>
              <Link
                to="/student/applications"
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>View all ({applications.length})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {applications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>You haven't been registered for any company drives yet.</p>
                  <p className="mt-1">
                    Your coordinator will map you to eligible company drives as schedules open.
                  </p>
                </div>
              ) : (
                applications.slice(0, 4).map((app) => (
                  <div
                    key={app._id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {app.company?.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeStyle(
                            app.status
                          )}`}
                        >
                          {formatStatusLabel(app.status)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Applied on {formatDate(app.createdAt)}
                        {app.company?.location && ` &middot; ${app.company.location}`}
                      </p>
                      {app.remarks && (
                        <p className="text-slate-700 mt-1 italic text-[11px] bg-white p-1.5 rounded border border-slate-200">
                          Recruiter note: "{app.remarks}"
                        </p>
                      )}
                    </div>

                    <div className="text-right sm:shrink-0">
                      {app.interviewDate && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          <span>Interview: {formatDate(app.interviewDate)}</span>
                        </div>
                      )}
                      {app.ctc && (
                        <div className="text-xs font-bold text-emerald-700 mt-1">
                          Package: {app.ctc}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Status updates reflect real-time feedback from recruitment teams</span>
            <Link
              to="/student/applications"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Full History &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
