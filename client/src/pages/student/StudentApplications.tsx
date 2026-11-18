import React, { useState, useEffect } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  Clock,
  CheckCircle,
  MessageSquare,
  Award,
} from 'lucide-react';
import api from '../../services/api';
import { Application } from '../../types';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  getStatusBadgeStyle,
  formatStatusLabel,
} from '../../utils/formatters';

export const StudentApplications: React.FC = () => {
  const { error } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/student/my-applications');
        if (res.data.success) {
          setApplications(res.data.applications || []);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to fetch your applications');
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Recruitment Applications
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Detailed status timeline and recruitment progress for all companies you have applied to.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
          Loading your applications dossier...
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No applications registered yet</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Your university placement coordinator maps student profiles to company recruitment drives based on eligibility criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
            >
              {/* Top row: Company and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {app.company?.name}
                    </h3>
                    {app.company?.website && (
                      <a
                        href={
                          app.company.website.startsWith('http')
                            ? app.company.website
                            : `https://${app.company.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Visit company website"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {app.company?.location && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {app.company.location}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${getStatusBadgeStyle(
                      app.status
                    )}`}
                  >
                    {formatStatusLabel(app.status)}
                  </span>
                </div>
              </div>

              {/* Middle details: Interview Date & CTC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Application Date
                  </span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {formatDate(app.createdAt)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Interview Schedule
                  </span>
                  {app.interviewDate ? (
                    <span className="font-bold text-indigo-700 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(app.interviewDate)}
                    </span>
                  ) : (
                    <span className="text-slate-400 mt-0.5 block font-medium">
                      Not scheduled yet
                    </span>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Compensation / Outcome
                  </span>
                  {app.ctc ? (
                    <span className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      Offered: {app.ctc}
                    </span>
                  ) : (
                    <span className="text-slate-400 mt-0.5 block font-medium">
                      In evaluation
                    </span>
                  )}
                </div>
              </div>

              {/* Remarks block if visible */}
              {app.remarks && (
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recruiter Remarks & Next Steps</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{app.remarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
