export type UserRole = 'ADMIN' | 'COORDINATOR' | 'HR' | 'STUDENT';

export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_IN_PROGRESS'
  | 'SELECTED'
  | 'REJECTED'
  | 'ON_HOLD';

export type CompanyStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  rollNumber?: string;
  course?: string;
  branch?: string;
  semester?: string;
  isActive: boolean;
  assignedCompanies?: { id: string; name: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  _id: string;
  name: string;
  description?: string;
  website?: string;
  location?: string;
  hrUsers?: (User | string)[];
  applicationDeadline?: string;
  driveDate?: string;
  status: CompanyStatus;
  totalApplications?: number;
  selectedApplications?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  studentId: User;
  companyId: Company;
  assignedBy?: User;
  status: ApplicationStatus;
  interviewDate?: string;
  ctc?: string;
  remarks?: string;
  isRemarksVisibleToStudent?: boolean;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogItem {
  _id: string;
  actor: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}
