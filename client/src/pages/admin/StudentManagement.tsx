import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Eye,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import api from '../../services/api';
import { User, Application } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  getStatusBadgeStyle,
  formatStatusLabel,
} from '../../utils/formatters';

const COURSES = ['ALL', 'BTECH', 'BCA', 'MCA', 'MTECH', 'DIPLOMA', 'ITI'];

export const StudentManagement: React.FC = () => {
  const { error } = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('');

  // Student Profile Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentApps, setStudentApps] = useState<Application[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/students', {
        params: {
          search,
          course: selectedCourse,
          branch: branchFilter ? branchFilter : 'ALL',
          page: currentPage,
          limit: 15,
        },
      });
      if (res.data.success) {
        setStudents(res.data.students || []);
        setTotalStudents(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [currentPage, selectedCourse]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const openStudentProfile = async (student: User) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
    try {
      setIsLoadingApps(true);
      const studentId = student.id || (student as any)._id;
      const res = await api.get(`/admin/students/${studentId}`);
      if (res.data.success) {
        setStudentApps(res.data.applications || []);
      }
    } catch {
      setStudentApps([]);
    } finally {
      setIsLoadingApps(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Records & Profiles
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter by academic domain, and inspect student placement history and application progress.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, roll no, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Course:</span>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
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
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Branch:</span>
            <input
              type="text"
              placeholder="e.g. CSE / ME"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              onBlur={() => {
                setCurrentPage(1);
                fetchStudents();
              }}
              className="w-28 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading student records...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No student profiles found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Coordinators create student accounts to enroll candidates into campus recruitment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Course & Branch</th>
                  <th className="px-6 py-3.5">Semester</th>
                  <th className="px-6 py-3.5">Applications</th>
                  <th className="px-6 py-3.5 text-right">View Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => (
                  <tr key={student.id || student._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-[11px] font-normal text-slate-500">{student.email}</p>
                        <p className="text-[11px] font-normal text-slate-400">{student.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {student.rollNumber || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">
                        {student.course || '—'}{' '}
                        {student.branch ? `(${student.branch})` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.semester || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {student.applicationCount || 0} applied
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openStudentProfile(student)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
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
          totalItems={totalStudents}
          itemsPerPage={15}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Modal: Student Detailed Profile */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={selectedStudent?.name || 'Student Profile'}
        description="Comprehensive placement dossier and company application history"
        maxWidth="xl"
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Roll Number
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {selectedStudent.rollNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Course
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.course || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Branch
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.branch || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Current Semester
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.semester || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Email
                </span>
                <span className="font-semibold text-slate-800 truncate block">
                  {selectedStudent.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                  Phone
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.phone}
                </span>
              </div>
            </div>

            {/* Applications List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                Submitted Company Applications ({studentApps.length})
              </h4>

              {isLoadingApps ? (
                <div className="p-4 text-center text-xs text-slate-400 animate-pulse">
                  Loading application history...
                </div>
              ) : studentApps.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-lg border border-slate-100">
                  This student has not been mapped to any company recruitment drives yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {studentApps.map((app) => (
                    <div
                      key={app._id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {app.companyId?.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadgeStyle(
                              app.status
                            )}`}
                          >
                            {formatStatusLabel(app.status)}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Assigned on {formatDate(app.createdAt)}
                          {app.assignedBy?.name && ` by ${app.assignedBy.name}`}
                        </p>
                        {app.remarks && (
                          <p className="text-slate-600 mt-1 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                            "{app.remarks}"
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:shrink-0">
                        {app.interviewDate && (
                          <div className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            Interview: {formatDate(app.interviewDate)}
                          </div>
                        )}
                        {app.ctc && (
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                            CTC: {app.ctc}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
