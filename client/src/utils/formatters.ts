import { ApplicationStatus, CompanyStatus, UserRole } from '../types';

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateString?: string): string => {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const getStatusBadgeStyle = (status: ApplicationStatus | string) => {
  switch (status) {
    case 'SELECTED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
    case 'SHORTLISTED':
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';
    case 'INTERVIEW_SCHEDULED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10';
    case 'INTERVIEW_IN_PROGRESS':
      return 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10';
    case 'UNDER_REVIEW':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
    case 'ON_HOLD':
      return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/10';
    case 'APPLIED':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';
  }
};

export const formatStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const getCompanyStatusBadgeStyle = (status: CompanyStatus | string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPCOMING':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'CLOSED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getRoleBadgeStyle = (role: UserRole | string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'COORDINATOR':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'HR':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'STUDENT':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};
