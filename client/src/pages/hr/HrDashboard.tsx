import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users,
  Clock,
  UserCheck,
  Calendar,
  CheckCircle,
  XCircle,
  PauseCircle,
  ArrowUpRight,
  Download,
  Building2,
} from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';

export const HrDashboard: React.FC = () => {
  const { error } = useToast();
  const { selectedCompanyId, setSelectedCompanyId } = useOutletContext<{
    selectedCompanyId?: string;
    setSelectedCompanyId?: (id: string) => void;
  }>();

  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        // Fetch assigned companies
        const compRes = await api.get('/hr/my-companies');
        if (compRes.data.success) {
          const comps = compRes.data.companies || [];
          setCompanies(comps);

          const activeCompanyId = selectedCompanyId || (comps.length > 0 ? comps[0]._id : '');
          if (!selectedCompanyId && comps.length > 0 && setSelectedCompanyId) {
            setSelectedCompanyId(comps[0]._id);
          }

          // Fetch stats for the active company
          const statsRes = await api.get('/hr/stats', {
            params: { companyId: activeCompanyId },
          });
          if (statsRes.data.success) {
            setStats(statsRes.data.stats);
          }
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load recruiter stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedCompanyId]);

  const activeCompany = companies.find((c) => c._id === selectedCompanyId);

  const handleExportCSV = async () => {
    if (!selectedCompanyId) {
      error('No company selected for export');
      return;
    }
    try {
      const res = await api.get('/hr/export-applicants', {
        params: { companyId: selectedCompanyId },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeCompany?.name || 'company'}-applicants.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      error('Failed to export applicant spreadsheet');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Recruiter Workspace
            </h1>
            {activeCompany && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                {activeCompany.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review applicant pipelines, update evaluation milestones, schedule interviews, and declare selections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!selectedCompanyId}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Candidate List (Excel)</span>
          </button>
          <Link
            to="/hr/applicants"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-2xs hover:bg-blue-700 transition-colors"
          >
            <span>Review Applicants</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No company assigned to your HR account</h3>
          <p className="text-xs text-slate-400 mt-1">
            Please ask your university placement administrator to link your account to your hiring organization.
          </p>
        </div>
      ) : (
        <>
          {/* Main Pipeline Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              title="Total Applicants"
              value={stats?.totalApplicants || 0}
              icon={Users}
              iconColor="text-blue-600 bg-blue-50 border-blue-100"
              subtext="Candidates assigned to your drive"
            />
            <StatCard
              title="Under Review"
              value={stats?.underReview || 0}
              icon={Clock}
              iconColor="text-amber-600 bg-amber-50 border-amber-100"
              subtext="Profiles pending screening"
            />
            <StatCard
              title="Shortlisted Candidates"
              value={stats?.shortlisted || 0}
              icon={UserCheck}
              iconColor="text-purple-600 bg-purple-50 border-purple-100"
              subtext="Passed initial resume/test screening"
            />
            <StatCard
              title="Interviews Scheduled"
              value={stats?.interviewScheduled || 0}
              icon={Calendar}
              iconColor="text-indigo-600 bg-indigo-50 border-indigo-100"
              subtext="Active technical / HR discussions"
            />
            <StatCard
              title="Selected / Offered"
              value={stats?.selected || 0}
              icon={CheckCircle}
              iconColor="text-emerald-600 bg-emerald-50 border-emerald-100"
              subtext="Candidates selected for hire"
            />
            <StatCard
              title="Not Selected / On Hold"
              value={(stats?.rejected || 0) + (stats?.onHold || 0)}
              icon={XCircle}
              iconColor="text-rose-600 bg-rose-50 border-rose-100"
              subtext={`${stats?.rejected || 0} rejected &middot; ${stats?.onHold || 0} on hold`}
            />
          </div>

          {/* Quick Action Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ready to review student applications?
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                View student dossiers, check course & branch eligibility, update interview milestones, and confirm CTC offers.
              </p>
            </div>
            <Link
              to="/hr/applicants"
              className="shrink-0 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              Open Applicant Ledger &rarr;
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
