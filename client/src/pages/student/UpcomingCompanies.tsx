import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import {
  formatDate,
  getCompanyStatusBadgeStyle,
  getStatusBadgeStyle,
  formatStatusLabel,
} from '../../utils/formatters';

export const UpcomingCompanies: React.FC = () => {
  const { error } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/student/upcoming-companies');
        if (res.data.success) {
          setCompanies(res.data.companies || []);
        }
      } catch (err: any) {
        error(err.response?.data?.message || 'Failed to load recruitment drives');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Campus Recruitment Drives
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore upcoming and active corporate hiring drives scheduled by the university placement cell.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No active drives right now</h3>
          <p className="text-xs text-slate-400 mt-1">
            New recruitment partner schedules will be published here by the placement department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <div
              key={company._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {company.name}
                    </h3>
                    {company.website && (
                      <a
                        href={
                          company.website.startsWith('http')
                            ? company.website
                            : `https://${company.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span className="truncate max-w-[180px]">{company.website}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${getCompanyStatusBadgeStyle(
                      company.status
                    )}`}
                  >
                    {company.status}
                  </span>
                </div>

                {company.description && (
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {company.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  {company.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{company.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Deadline:{' '}
                      <strong className="text-slate-800">
                        {formatDate(company.applicationDeadline)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Drive Date:{' '}
                      <strong className="text-slate-800">
                        {formatDate(company.driveDate)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Status Pill */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">
                  Your Status:
                </span>
                {company.hasApplied ? (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadgeStyle(
                      company.applicationStatus
                    )}`}
                  >
                    {formatStatusLabel(company.applicationStatus)}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Not Applied
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
