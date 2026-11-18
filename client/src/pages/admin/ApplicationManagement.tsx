import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import { Application, Company } from '../../types';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  getStatusBadgeStyle,
  formatStatusLabel,
} from '../../utils/formatters';

const STATUS_OPTIONS = [
  'ALL',
  'APPLIED',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_IN_PROGRESS',
  'SELECTED',
  'REJECTED',
  'ON_HOLD',
];

const COURSES = ['ALL', 'BTECH', 'BCA', 'MCA', 'MTECH', 'DIPLOMA', 'ITI'];

export const ApplicationManagement: React.FC = () => {
  const { error } = useToast();

  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/applications', {
        params: {
          search,
          companyId: companyFilter,
          status: statusFilter,
          course: courseFilter,
          branch: branchFilter ? branchFilter : 'ALL',
          page: currentPage,
          limit: 15,
        },
      });
      if (res.data.success) {
        setApplications(res.data.applications || []);
        setTotalApplications(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/admin/companies');
      if (res.data.success) {
        setCompanies(res.data.companies || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchCompanies();
  }, [currentPage, companyFilter, statusFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/admin/export-applications', {
        params: { companyId: companyFilter, status: statusFilter },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
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

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Master Applications Oversight
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global monitoring of student-to-company assignments, interview rounds, and selection outcomes.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Advanced Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Company Filter */}
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st === 'ALL' ? 'All Statuses' : formatStatusLabel(st)}
                </option>
              ))}
            </select>

            {/* Course Filter */}
            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {COURSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Branch Filter */}
            <input
              type="text"
              placeholder="Branch (e.g. CSE)"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              onBlur={() => {
                setCurrentPage(1);
                fetchApplications();
              }}
              className="w-24 text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading applications data...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No applications found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Applications are created by coordinators assigning eligible students to company drives.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Student Candidate</th>
                  <th className="px-6 py-3.5">Target Company</th>
                  <th className="px-6 py-3.5">Recruitment Status</th>
                  <th className="px-6 py-3.5">Interview / CTC</th>
                  <th className="px-6 py-3.5">Assigned By</th>
                  <th className="px-6 py-3.5">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {app.studentId?.name || 'Unknown Student'}
                        </p>
                        <p className="text-[11px] font-normal text-slate-500">
                          {app.studentId?.rollNumber} &middot; {app.studentId?.course} ({app.studentId?.branch})
                        </p>
                        <p className="text-[11px] font-normal text-slate-400">
                          {app.studentId?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">
                          {app.companyId?.name || 'Company'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {app.companyId?.location}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeStyle(
                          app.status
                        )}`}
                      >
                        {formatStatusLabel(app.status)}
                      </span>
                      {app.remarks && (
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs truncate" title={app.remarks}>
                          "{app.remarks}"
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {app.interviewDate ? (
                        <div className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                          {formatDate(app.interviewDate)}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                      {app.ctc && (
                        <div className="text-[11px] font-bold text-emerald-700 mt-1">
                          CTC: {app.ctc}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="font-medium text-slate-800">
                        {app.assignedBy?.name || 'System'}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {app.assignedBy?.role || ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(app.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalApplications}
          itemsPerPage={15}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};
