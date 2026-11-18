import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Download,
} from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/ui/StatCard';
import { formatDateTime } from '../../utils/formatters';
import { useToast } from '../../components/ui/Toast';

export const AdminDashboard: React.FC = () => {
  const { error } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/activity-logs'),
        ]);
        if (statsRes.data.success) {
          setStats(statsRes.data.stats);
        }
        if (logsRes.data.success) {
          setLogs(logsRes.data.logs || []);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load admin dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/export-applications', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campus-applications-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      error('Failed to export CSV');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
            Placement Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete institutional overview of students, partner companies, HR accounts, and drives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV Report</span>
          </button>
          <Link
            to="/admin/companies"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-2xs hover:bg-blue-700 transition-colors"
          >
            <span>Manage Companies</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Primary Key Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents || 0}
          icon={GraduationCap}
          iconColor="text-blue-600 bg-blue-50 border-blue-100"
          subtext="Enrolled across all courses & branches"
        />
        <StatCard
          title="Partner Companies"
          value={stats?.totalCompanies || 0}
          icon={Building2}
          iconColor="text-purple-600 bg-purple-50 border-purple-100"
          subtext="Registered corporate hiring partners"
        />
        <StatCard
          title="Placement Coordinators"
          value={stats?.totalCoordinators || 0}
          icon={UserCheck}
          iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
          subtext="Faculty & student coordinators"
        />
        <StatCard
          title="HR Accounts"
          value={stats?.totalHrs || 0}
          icon={Briefcase}
          iconColor="text-teal-600 bg-teal-50 border-teal-100"
          subtext="Assigned corporate recruiters"
        />
      </div>

      {/* Recruitment Pipeline Status Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Recruitment Pipeline & Outcomes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Applications"
            value={stats?.totalApplications || 0}
            icon={FileText}
            iconColor="text-slate-600 bg-slate-100 border-slate-200"
            subtext="Applications submitted to date"
          />
          <StatCard
            title="Active / In Progress"
            value={stats?.activeApplications || 0}
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 border-amber-100"
            subtext="Under review, shortlisted, or interviewing"
          />
          <StatCard
            title="Selected Students"
            value={stats?.selectedCount || 0}
            icon={CheckCircle}
            iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
            trend={{
              value: stats?.totalApplications
                ? `${Math.round((stats.selectedCount / stats.totalApplications) * 100)}% select rate`
                : '0%',
              isPositive: true,
            }}
            subtext="Offers extended & accepted"
          />
          <StatCard
            title="Rejected Applications"
            value={stats?.rejectedCount || 0}
            icon={XCircle}
            iconColor="text-rose-600 bg-rose-50 border-rose-100"
            subtext="Not selected in current drives"
          />
        </div>
      </div>

      {/* Analytics Breakdown & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch-wise breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Branch-wise Placements
            </h3>
            <span className="text-[11px] text-slate-400">Applications</span>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.branchStats && stats.branchStats.length > 0 ? (
              stats.branchStats.map((item: any) => {
                const total = item.total || 0;
                const selected = item.selected || 0;
                const pct = total > 0 ? Math.round((selected / total) * 100) : 0;
                return (
                  <div key={item._id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item._id || 'Unassigned'}</span>
                      <span className="text-slate-500">
                        {selected} / {total} selected ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(8, (total / (stats.totalApplications || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No branch statistics recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Company-wise applications */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Top Hiring Companies
            </h3>
            <span className="text-[11px] text-slate-400">Total Applicants</span>
          </div>

          <div className="mt-4 space-y-3">
            {stats?.companyStats && stats.companyStats.length > 0 ? (
              stats.companyStats.map((c: any) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-semibold text-slate-800">{c._id}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{c.total} applied</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.selected} offers
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No company drives active yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Audit / Activity Logs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Live Activity Stream
            </h3>
            <span className="text-[11px] text-slate-400">Audit trail</span>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {logs.length > 0 ? (
              logs.slice(0, 8).map((log) => (
                <div
                  key={log._id}
                  className="text-xs border-l-2 border-blue-500 pl-3 py-1 space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600">{log.details || log.action}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No recent activity logged.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
