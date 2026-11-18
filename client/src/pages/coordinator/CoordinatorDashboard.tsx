import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  FileText,
  UserPlus,
  Send,
  ArrowUpRight,
  PieChart,
  Layers,
} from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';

export const CoordinatorDashboard: React.FC = () => {
  const { error } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/coordinator/stats');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load coordinator stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Placement Coordination Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register students into recruitment tracks and assign applications to participating corporate partners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/coordinator/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>Enroll Student</span>
          </Link>
          <Link
            to="/coordinator/make-application"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-2xs hover:bg-blue-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Make Application</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Total Students Enrolled"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          iconColor="text-blue-600 bg-blue-50 border-blue-100"
          subtext="Students registered in the placement portal"
        />
        <StatCard
          title="Active Recruitment Partners"
          value={stats?.totalCompanies || 0}
          icon={Building2}
          iconColor="text-purple-600 bg-purple-50 border-purple-100"
          subtext="Companies currently open or upcoming"
        />
        <StatCard
          title="Assigned Applications"
          value={stats?.totalApplications || 0}
          icon={FileText}
          iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
          subtext="Student applications mapped to drives"
        />
      </div>

      {/* Domain & Branch Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Course-wise count */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Course-wise Student Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Total Enrolled</span>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.courseStats && stats.courseStats.length > 0 ? (
              stats.courseStats.map((item: any) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-bold text-slate-800">{item._id || 'Unassigned'}</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {item.count} students
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No students enrolled yet.
              </p>
            )}
          </div>
        </div>

        {/* Branch-wise count */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Branch-wise Student Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Specializations</span>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.branchStats && stats.branchStats.length > 0 ? (
              stats.branchStats.map((item: any) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-bold text-slate-800">{item._id || 'Unassigned'}</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {item.count} students
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No branches registered yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
