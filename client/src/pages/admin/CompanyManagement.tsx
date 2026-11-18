import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  ExternalLink,
  MapPin,
  Calendar,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import { Company, User } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { useToast } from '../../components/ui/Toast';
import { formatDate, getCompanyStatusBadgeStyle } from '../../utils/formatters';

export const CompanyManagement: React.FC = () => {
  const { success, error } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [allHrs, setAllHrs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    location: '',
    applicationDeadline: '',
    driveDate: '',
    status: 'ACTIVE',
    hrUsers: [] as string[],
  });

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/companies', {
        params: { search, status: statusFilter },
      });
      if (res.data.success) {
        setCompanies(res.data.companies || []);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to fetch companies');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHrs = async () => {
    try {
      const res = await api.get('/admin/hr-accounts');
      if (res.data.success) {
        setAllHrs(res.data.hrAccounts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchHrs();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      website: '',
      location: '',
      applicationDeadline: '',
      driveDate: '',
      status: 'ACTIVE',
      hrUsers: [],
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      website: company.website || '',
      location: company.location || '',
      applicationDeadline: company.applicationDeadline
        ? company.applicationDeadline.split('T')[0]
        : '',
      driveDate: company.driveDate ? company.driveDate.split('T')[0] : '',
      status: company.status || 'ACTIVE',
      hrUsers: (company.hrUsers || []).map((u: any) => (typeof u === 'string' ? u : u._id)),
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteModalOpen(true);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/companies', formData);
      if (res.data.success) {
        success(`Company "${formData.name}" created successfully!`);
        setIsCreateModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create company');
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    try {
      const res = await api.put(`/admin/companies/${selectedCompany._id}`, formData);
      if (res.data.success) {
        success(`Company "${formData.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update company');
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;
    try {
      const res = await api.delete(`/admin/companies/${selectedCompany._id}`);
      if (res.data.success) {
        success(res.data.message || 'Company removed.');
        setIsDeleteModalOpen(false);
        fetchCompanies();
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to delete company');
    }
  };

  const toggleHrSelection = (hrId: string) => {
    setFormData((prev) => {
      const exists = prev.hrUsers.includes(hrId);
      return {
        ...prev,
        hrUsers: exists ? prev.hrUsers.filter((id) => id !== hrId) : [...prev.hrUsers, hrId],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Recruitment Partners & Companies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage participating hiring organizations, recruitment dates, and assigned HR personnel.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Companies Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No companies found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Get started by adding your first recruitment partner to manage campus placement drives.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Company</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => {
            const hrList = (company.hrUsers || []) as any[];
            return (
              <div
                key={company._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                        {company.name}
                      </h3>
                      {company.website && (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span className="truncate max-w-[200px]">{company.website}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getCompanyStatusBadgeStyle(
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
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Drive Date:{' '}
                        <strong className="text-slate-800">
                          {formatDate(company.driveDate)}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Applications:{' '}
                        <strong className="text-slate-800">
                          {company.totalApplications || 0}
                        </strong>{' '}
                        ({company.selectedApplications || 0} selected)
                      </span>
                    </div>
                  </div>

                  {/* Assigned HRs */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Assigned HR Accounts ({hrList.length}):
                    </span>
                    {hrList.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {hrList.map((hr: any) => (
                          <span
                            key={hr._id || hr}
                            className="inline-flex items-center text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium border border-slate-200"
                          >
                            {hr.name || hr.email || 'HR User'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-600 italic">
                        No HR accounts assigned yet.
                      </span>
                    )}
                  </div>
                </div>

                {/* Card actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(company)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Company"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(company)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete or Deactivate Company"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Company */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Recruitment Partner"
        description="Register a new hiring partner organization and connect HR accounts."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tata Consultancy Services"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://tcs.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Mumbai / Pune"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, applicationDeadline: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Drive Date
              </label>
              <input
                type="date"
                value={formData.driveDate}
                onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="ACTIVE">ACTIVE (Open for applications)</option>
                <option value="UPCOMING">UPCOMING (Upcoming drive)</option>
                <option value="CLOSED">CLOSED (Drive concluded)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Description / Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the organization and recruitment profile..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* HR Assignment */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign HR Accounts
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Select one or more HR accounts authorized to view applicants and update statuses for this company:
              </p>
              {allHrs.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  No HR accounts found. You can create HR accounts in the "HR Accounts" tab.
                </p>
              ) : (
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-1">
                  {allHrs.map((hr) => {
                    const isChecked = formData.hrUsers.includes(hr.id || (hr as any)._id);
                    return (
                      <label
                        key={hr.id || (hr as any)._id}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleHrSelection(hr.id || (hr as any)._id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{hr.name}</p>
                          <p className="text-[11px] text-slate-400">{hr.email} &middot; {hr.phone}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Create Company
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Company */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Company Details"
        description="Update partner information, status, or HR assignments."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateCompany} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) =>
                  setFormData({ ...formData, applicationDeadline: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Drive Date
              </label>
              <input
                type="date"
                value={formData.driveDate}
                onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="UPCOMING">UPCOMING</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* HR Assignment */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned HR Accounts
              </label>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-1">
                {allHrs.map((hr) => {
                  const isChecked = formData.hrUsers.includes(hr.id || (hr as any)._id);
                  return (
                    <label
                      key={hr.id || (hr as any)._id}
                      className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleHrSelection(hr.id || (hr as any)._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-semibold text-slate-800">{hr.name}</p>
                        <p className="text-[11px] text-slate-400">{hr.email} &middot; {hr.phone}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCompany}
        title={`Remove ${selectedCompany?.name}?`}
        message="Are you sure you want to delete or deactivate this company? If existing student applications are linked, it will be marked CLOSED instead of permanently deleting."
        confirmText="Confirm Delete / Close"
        isDestructive={true}
      />
    </div>
  );
};
