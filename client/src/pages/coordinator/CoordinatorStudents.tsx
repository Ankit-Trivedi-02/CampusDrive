import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import { User } from "../../types";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { formatDate } from "../../utils/formatters";

const COURSES = ["BTECH", "BCA", "MCA", "MTECH", "DIPLOMA", "ITI"];

export const CoordinatorStudents: React.FC = () => {
  const { success, error } = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    course: "",
    branch: "",
    semester: "",
    password: "",
    isActive: true,
  });

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/coordinator/students", {
        params: {
          search,
          course: selectedCourse,
          branch: branchFilter ? branchFilter : "ALL",
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
      error(err.response?.data?.message || "Failed to fetch students");
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

  const openCreateModal = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      rollNumber: "",
      course: "",
      branch: "",
      semester: "",
      password: "",
      isActive: true,
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      rollNumber: student.rollNumber || "",
      course: student.course || "",
      branch: student.branch || "",
      semester: student.semester || "",
      password: "",
      isActive: student.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/coordinator/students", formData);
      if (res.data.success) {
        success(`Student profile created for ${formData.name}!`);
        setIsCreateModalOpen(false);
        fetchStudents();
      }
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to create student account");
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const studentId = selectedStudent.id || selectedStudent._id;
      const res = await api.put(`/coordinator/students/${studentId}`, formData);
      if (res.data.success) {
        success(`Student profile for ${formData.name} updated!`);
        setIsEditModalOpen(false);
        fetchStudents();
      }
    } catch (err: any) {
      error(err.response?.data?.message || "Failed to update student account");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Student Enrollment & Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enroll students individually, assign academic domains, and maintain
            student placement records.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-2xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-sm"
        >
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll no, or email..."
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
              <option value="ALL">All Courses</option>
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
              placeholder="e.g. CSE / Mechanical"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              onBlur={() => {
                setCurrentPage(1);
                fetchStudents();
              }}
              className="w-32 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading enrolled students...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">
              No students found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Click "Enroll New Student" to add student records for recruitment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Course & Branch</th>
                  <th className="px-6 py-3.5">Semester</th>
                  <th className="px-6 py-3.5">Applications</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((student) => (
                  <tr
                    key={student.id || student._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span>{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {student.rollNumber || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800">
                          {student.email}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {student.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">
                        {student.course || "—"}{" "}
                        {student.branch ? `(${student.branch})` : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.semester || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {student.applicationCount || 0} applied
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(student)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Student Details"
                      >
                        <Edit2 className="w-4 h-4" />
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

      {/* Modal: Enroll Student */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Enroll Student"
        description="Create an individual student account for the campus placement portal."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Kavya Sharma"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="kavya@student.edu"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="9123456789"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number (Optional)
              </label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Course *
              </label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                placeholder="e.g. B.Tech, BCA, MCA"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
                placeholder="e.g. CSE / Mechanical / ECE"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Semester (Optional)
            </label>
            <select
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">----</option>
              {['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map((semester) => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>
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
              Enroll Student
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Student */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Information"
        description="Update profile details, academic branch, or reset credentials."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            {/* 
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) =>
                  setFormData({ ...formData, rollNumber: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div> */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Course
              </label>
              <input
                type="text"
                required
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                placeholder="e.g. B.Tech, BCA, MCA"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            {/* 
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Semester
              </label>
              <input
                type="text"
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div> */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reset Password (Optional)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Leave blank to preserve current password"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Student Account is Active</span>
            </label>
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
    </div>
  );
};
