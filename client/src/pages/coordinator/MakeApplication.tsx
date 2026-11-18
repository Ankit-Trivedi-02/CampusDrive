import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Building2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Calendar,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { Company, User } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatters';

export const MakeApplication: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [students, setStudents] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form selection
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [validationError, setValidationError] = useState('');

  // Selected entities preview
  const selectedStudent = students.find(
    (s) => (s.id || (s as any)._id) === selectedStudentId
  );
  const selectedCompany = companies.find((c) => c._id === selectedCompanyId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [studentsRes, companiesRes] = await Promise.all([
          api.get('/coordinator/students', { params: { limit: 100 } }),
          api.get('/coordinator/companies'),
        ]);
        if (studentsRes.data.success) {
          setStudents(studentsRes.data.students || []);
        }
        if (companiesRes.data.success) {
          setCompanies(companiesRes.data.companies || []);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load options');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedStudentId || !selectedCompanyId) {
      setValidationError('Please select both a student and a target company.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/coordinator/applications', {
        studentId: selectedStudentId,
        companyId: selectedCompanyId,
      });

      if (res.data.success) {
        success(
          `Application registered: ${selectedStudent?.name} mapped to ${selectedCompany?.name}!`
        );
        navigate('/coordinator/applications');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Failed to register application. It may already exist.';
      setValidationError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-xs text-slate-500 animate-pulse">
        Loading placement candidate and company registers...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Make Recruitment Application
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Register a student application with a participating corporate recruitment partner.
        </p>
      </div>

      {validationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Duplicate or Registration Error</p>
            <p className="mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Step 1: Select Student */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Enrolled Student *
              </label>
              <select
                required
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setValidationError('');
                }}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="">-- Choose Candidate --</option>
                {students.map((s) => {
                  const sId = s.id || (s as any)._id;
                  return (
                    <option key={sId} value={sId}>
                      {s.name} &mdash; {s.course} {s.branch ? `(${s.branch})` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Student preview card */}
              {selectedStudent && (
                <div className="mt-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900">{selectedStudent.name}</span>
                  </div>
                  <p className="text-slate-600">
                    {selectedStudent.course}{selectedStudent.branch ? ` (${selectedStudent.branch})` : ''}
                  </p>
                  <p className="text-slate-500 text-[11px]">{selectedStudent.email}</p>
                </div>
              )}
            </div>

            {/* Step 2: Select Company */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Select Hiring Partner *
              </label>
              <select
                required
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setValidationError('');
                }}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="">-- Choose Partner Company --</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} &mdash; {c.location || 'Pan India'} ({c.status})
                  </option>
                ))}
              </select>

              {/* Company preview card */}
              {selectedCompany && (
                <div className="mt-3 p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900">{selectedCompany.name}</span>
                  </div>
                  {selectedCompany.location && (
                    <p className="text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {selectedCompany.location}
                    </p>
                  )}
                  {selectedCompany.driveDate && (
                    <p className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Drive Date: {formatDate(selectedCompany.driveDate)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Prevention Notice */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Before you register:
            </div>
            <p>
              Confirm the student and company details. The portal automatically enforces unique compound
              constraints to guarantee no duplicate applications can be created for the same student and company.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/coordinator/applications')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStudentId || !selectedCompanyId}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Confirm & Register Application</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
