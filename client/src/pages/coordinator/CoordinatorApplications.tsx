import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Building2,
  Lock,
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

const COURSES = ['ALL', 'BTECH', 'BCA', 'MCA', 'MTECH', 'DIPLOMA', 'ITI'];

export const CoordinatorApplications: React.FC = () => {
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
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/coordinator/applications', {
        params: {
          search,
          companyId: companyFilter,
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
      const res = await api.get('/coordinator/companies');
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
  }, [currentPage, companyFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registered Student Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track student submissions and company assignment status.
          </p>
        </div>

        <Link
          to="/coordinator/make-application"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, roll number, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
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

          <input
            type="text"
            placeholder="Branch (e.g. CSE)"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            onBlur={() => {
              setCurrentPage(1);
              fetchApplications();
            }}
            className="w-28 text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading student applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No applications registered</h3>
            <p className="text-xs text-slate-400 mt-1">
              Click "New Application" to map a student to an active recruitment company.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Target Company</th>
                  <th className="px-6 py-3.5">Recruitment Status</th>
                  <th className="px-6 py-3.5">Confidentiality</th>
                  <th className="px-6 py-3.5">Application Date</th>
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
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Remarks protected</span>
                      </div>
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
