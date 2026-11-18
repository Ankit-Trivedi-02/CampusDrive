import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  DollarSign,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../services/api';
import { Application, ApplicationStatus, Company } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  formatDateTime,
  getStatusBadgeStyle,
  formatStatusLabel,
} from '../../utils/formatters';

const STATUS_LIST: ApplicationStatus[] = [
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

export const HrApplicants: React.FC = () => {
  const { success, error } = useToast();
  const { selectedCompanyId, setSelectedCompanyId } = useOutletContext<{
    selectedCompanyId?: string;
    setSelectedCompanyId?: (id: string) => void;
  }>();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');

  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('SHORTLISTED');
  const [interviewDate, setInterviewDate] = useState('');
  const [ctc, setCtc] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isRemarksVisibleToStudent, setIsRemarksVisibleToStudent] = useState(true);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Fetch HR's companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/hr/my-companies');
        if (res.data.success) {
          const comps = res.data.companies || [];
          setCompanies(comps);
          if (!selectedCompanyId && comps.length > 0 && setSelectedCompanyId) {
            setSelectedCompanyId(comps[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompanies();
  }, []);

  const fetchApplicants = async () => {
    if (!selectedCompanyId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.get('/hr/applicants', {
        params: {
          companyId: selectedCompanyId,
          status: statusFilter,
          course: courseFilter,
          branch: branchFilter ? branchFilter : 'ALL',
          search,
          page: currentPage,
          limit: 15,
        },
      });
      if (res.data.success) {
        setApplicants(res.data.applicants || []);
        setTotalApplicants(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch applicants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [selectedCompanyId, currentPage, statusFilter, courseFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplicants();
  };

  const openStatusModal = (app: Application) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setInterviewDate(app.interviewDate ? app.interviewDate.split('T')[0] : '');
    setCtc(app.ctc || '');
    setRemarks(app.remarks || '');
    setIsRemarksVisibleToStudent(
      app.isRemarksVisibleToStudent !== undefined ? app.isRemarksVisibleToStudent : true
    );
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setIsSubmittingStatus(true);
      const res = await api.patch(`/hr/applications/${selectedApp._id}/status`, {
        status: newStatus,
        interviewDate: interviewDate || undefined,
        ctc: ctc || undefined,
        remarks: remarks || undefined,
        isRemarksVisibleToStudent,
      });

      if (res.data.success) {
        success(`Status updated to ${newStatus} for ${selectedApp.studentId?.name}!`);
        setIsStatusModalOpen(false);
        fetchApplicants();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update candidate status');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedCompanyId) return;
    try {
      const activeComp = companies.find((c) => c._id === selectedCompanyId);
      const res = await api.get('/hr/export-applicants', {
        params: { companyId: selectedCompanyId, status: statusFilter },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeComp?.name || 'company'}_applicants.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Candidate spreadsheet downloaded successfully!');
    } catch {
      error('Failed to export candidate spreadsheet');
    }
  };

  const activeCompany = companies.find((c) => c._id === selectedCompanyId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Applicants
            </h1>
            {activeCompany && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                {activeCompany.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review student details, evaluate academic credentials, and advance candidates through recruitment stages.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!selectedCompanyId || applicants.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>DOWNLOAD EXCEL</span>
        </button>
      </div>

      {/* Filter and Company Switcher Ribbon */}
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
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              {STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {formatStatusLabel(st)}
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
                fetchApplicants();
              }}
              className="w-28 text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Applicants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading candidate records...
          </div>
        ) : !selectedCompanyId ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Please select an assigned company from the header dropdown.
          </div>
        ) : applicants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No applicants yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Student names and details will appear here as placement applications are registered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Candidate Details</th>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Domain / Course</th>
                  <th className="px-6 py-3.5">Recruitment Status</th>
                  <th className="px-6 py-3.5">Interview / CTC</th>
                  <th className="px-6 py-3.5 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {applicants.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>
                        <p className="font-semibold text-slate-900">{app.studentId?.name}</p>
                        <p className="text-[11px] font-normal text-slate-500">{app.studentId?.email}</p>
                        <p className="text-[11px] font-normal text-slate-400">{app.studentId?.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {app.studentId?.rollNumber || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800">
                        {app.studentId?.course}{' '}
                        {app.studentId?.branch ? `(${app.studentId.branch})` : ''}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        Sem: {app.studentId?.semester || '—'}
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
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openStatusModal(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Change Status</span>
                      </button>
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
          totalItems={totalApplicants}
          itemsPerPage={15}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Modal: Change Status (Inspired by the Reference PDF Mockup) */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Record Interview Outcome & Status"
        description="Update the student's status, add interview rounds, CTC, and remarks."
        maxWidth="lg"
      >
        {selectedApp && (
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            {/* Candidate Header Pill */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{selectedApp.studentId?.name}</p>
                <p className="text-[11px] text-slate-500">
                  Roll: {selectedApp.studentId?.rollNumber} &middot; {selectedApp.studentId?.course} ({selectedApp.studentId?.branch})
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadgeStyle(
                  selectedApp.status
                )}`}
              >
                Current: {formatStatusLabel(selectedApp.status)}
              </span>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                New Recruitment Status *
              </label>
              <select
                required
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                {STATUS_LIST.map((st) => (
                  <option key={st} value={st}>
                    {formatStatusLabel(st)}
                  </option>
                ))}
              </select>
            </div>

            {/* Interview Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Interview Date (Optional / If Scheduled)
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* CTC Offered Field (from PDF reference) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Annual Compensation / CTC Package (e.g. 8.5 LPA)
              </label>
              <input
                type="text"
                value={ctc}
                onChange={(e) => setCtc(e.target.value)}
                placeholder="e.g. 7.5 LPA / 12 LPA"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Remarks Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HR Remarks / Feedback
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter technical round comments, venue details, or next steps..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Student Visibility Toggle */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isRemarksVisibleToStudent}
                  onChange={(e) => setIsRemarksVisibleToStudent(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Make remarks visible to the student on their portal</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingStatus}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmittingStatus ? 'Saving Outcome...' : 'Save & Confirm Outcome'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
