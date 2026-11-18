import { Response } from 'express';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Company } from '../models/Company';
import { Application } from '../models/Application';
import { ActivityLog } from '../models/ActivityLog';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

// 1. Dashboard Stats
export const getAdminStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalStudents,
      totalCompanies,
      totalCoordinators,
      totalHrs,
      totalApplications,
      selectedCount,
      rejectedCount,
      activeApplications,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      Company.countDocuments(),
      User.countDocuments({ role: 'COORDINATOR' }),
      User.countDocuments({ role: 'HR' }),
      Application.countDocuments(),
      Application.countDocuments({ status: 'SELECTED' }),
      Application.countDocuments({ status: 'REJECTED' }),
      Application.countDocuments({
        status: { $in: ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_IN_PROGRESS'] },
      }),
    ]);

    // Branch-wise applications aggregation
    const branchStats = await Application.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: { $ifNull: ['$student.branch', 'Unknown'] },
          total: { $sum: 1 },
          selected: {
            $sum: { $cond: [{ $eq: ['$status', 'SELECTED'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Company-wise applications aggregation
    const companyStats = await Application.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $group: {
          _id: '$company.name',
          total: { $sum: 1 },
          selected: {
            $sum: { $cond: [{ $eq: ['$status', 'SELECTED'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Status breakdown
    const statusBreakdown = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalCoordinators,
        totalHrs,
        totalApplications,
        selectedCount,
        rejectedCount,
        activeApplications,
        branchStats,
        companyStats,
        statusBreakdown,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Company Management
export const getCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query;
    const query: any = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const companies = await Company.find(query)
      .populate('hrUsers', 'name email phone')
      .sort({ createdAt: -1 });

    // Attach application counts for each company
    const companyIds = companies.map((c) => c._id);
    const appCounts = await Application.aggregate([
      { $match: { companyId: { $in: companyIds } } },
      {
        $group: {
          _id: '$companyId',
          totalApps: { $sum: 1 },
          selectedApps: { $sum: { $cond: [{ $eq: ['$status', 'SELECTED'] }, 1, 0] } },
        },
      },
    ]);

    const countMap: Record<string, { totalApps: number; selectedApps: number }> = {};
    appCounts.forEach((c) => {
      countMap[c._id.toString()] = {
        totalApps: c.totalApps,
        selectedApps: c.selectedApps,
      };
    });

    const result = companies.map((c) => ({
      ...c.toObject(),
      totalApplications: countMap[c._id.toString()]?.totalApps || 0,
      selectedApplications: countMap[c._id.toString()]?.selectedApps || 0,
    }));

    res.status(200).json({ success: true, companies: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, website, location, applicationDeadline, driveDate, status, hrUsers } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Company name is required.' });
      return;
    }

    const existing = await Company.findOne({ name: name.trim() });
    if (existing) {
      res.status(400).json({ success: false, message: `Company "${name}" already exists.` });
      return;
    }

    const company = await Company.create({
      name: name.trim(),
      description: description || '',
      website: website || '',
      location: location || '',
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      driveDate: driveDate ? new Date(driveDate) : undefined,
      status: status || 'UPCOMING',
      hrUsers: Array.isArray(hrUsers) ? hrUsers : [],
    });

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'COMPANY_CREATED',
      targetType: 'Company',
      targetId: company._id.toString(),
      details: `Created company ${company.name}`,
    });

    const populated = await Company.findById(company._id).populate('hrUsers', 'name email phone');

    res.status(201).json({ success: true, company: populated, message: 'Company created successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, website, location, applicationDeadline, driveDate, status, hrUsers } = req.body;

    const company = await Company.findById(id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    if (name && name.trim() !== company.name) {
      const existing = await Company.findOne({ name: name.trim() });
      if (existing) {
        res.status(400).json({ success: false, message: `Company "${name}" already exists.` });
        return;
      }
      company.name = name.trim();
    }

    if (description !== undefined) company.description = description;
    if (website !== undefined) company.website = website;
    if (location !== undefined) company.location = location;
    if (applicationDeadline !== undefined) {
      company.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : undefined;
    }
    if (driveDate !== undefined) {
      company.driveDate = driveDate ? new Date(driveDate) : undefined;
    }
    if (status) company.status = status;
    if (hrUsers !== undefined && Array.isArray(hrUsers)) company.hrUsers = hrUsers;

    await company.save();

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'COMPANY_UPDATED',
      targetType: 'Company',
      targetId: company._id.toString(),
      details: `Updated details for ${company.name}`,
    });

    const populated = await Company.findById(company._id).populate('hrUsers', 'name email phone');

    res.status(200).json({ success: true, company: populated, message: 'Company updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    // Check if applications exist
    const appsCount = await Application.countDocuments({ companyId: id });
    if (appsCount > 0) {
      // Instead of hard delete, deactivate
      company.status = 'CLOSED';
      await company.save();
      res.status(200).json({
        success: true,
        message: `Company has ${appsCount} existing applications, so its status was marked as CLOSED.`,
      });
      return;
    }

    await Company.findByIdAndDelete(id);

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'COMPANY_DELETED',
      targetType: 'Company',
      targetId: String(id),
      details: `Deleted company ${company.name}`,
    });

    res.status(200).json({ success: true, message: 'Company deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Coordinator Management
export const getCoordinators = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = { role: 'COORDINATOR' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const coordinators = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ success: true, coordinators });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCoordinator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, course, branch } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'Name, email, phone, and password are required.' });
      return;
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const coordinator = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: 'COORDINATOR',
      course: course || '',
      branch: branch || '',
      isActive: true,
    });

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'COORDINATOR_CREATED',
      targetType: 'User',
      targetId: coordinator._id.toString(),
      details: `Created coordinator ${coordinator.name} (${coordinator.email})`,
    });

    res.status(201).json({
      success: true,
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        email: coordinator.email,
        phone: coordinator.phone,
        role: coordinator.role,
        course: coordinator.course,
        branch: coordinator.branch,
        isActive: coordinator.isActive,
      },
      message: 'Coordinator created successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoordinator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, course, branch, isActive, password } = req.body;

    const coordinator = await User.findOne({ _id: id, role: 'COORDINATOR' });
    if (!coordinator) {
      res.status(404).json({ success: false, message: 'Coordinator not found.' });
      return;
    }

    if (name) coordinator.name = name.trim();
    if (email) coordinator.email = email.trim().toLowerCase();
    if (phone) coordinator.phone = phone.trim();
    if (course !== undefined) coordinator.course = course;
    if (branch !== undefined) coordinator.branch = branch;
    if (isActive !== undefined) coordinator.isActive = isActive;
    if (password && password.trim().length >= 6) {
      coordinator.password = password.trim();
    }

    await coordinator.save();

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'COORDINATOR_UPDATED',
      targetType: 'User',
      targetId: coordinator._id.toString(),
      details: `Updated coordinator ${coordinator.name}`,
    });

    res.status(200).json({
      success: true,
      coordinator: {
        id: coordinator._id,
        name: coordinator.name,
        email: coordinator.email,
        phone: coordinator.phone,
        role: coordinator.role,
        course: coordinator.course,
        branch: coordinator.branch,
        isActive: coordinator.isActive,
      },
      message: 'Coordinator updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. HR Management
export const getHrAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    const query: any = { role: 'HR' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const hrUsers = await User.find(query).select('-password').sort({ createdAt: -1 });

    // Fetch assigned companies for each HR
    const companies = await Company.find({}, '_id name hrUsers');

    const hrList = hrUsers.map((hr) => {
      const assigned = companies
        .filter((comp) => comp.hrUsers.some((uid) => uid.toString() === hr._id.toString()))
        .map((comp) => ({ id: comp._id, name: comp.name }));

      return {
        ...hr.toObject(),
        assignedCompanies: assigned,
      };
    });

    res.status(200).json({ success: true, hrAccounts: hrList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHrAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, companyIds } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, message: 'Name, email, phone, and password are required.' });
      return;
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      res.status(400).json({ success: false, message: 'User with this email already exists.' });
      return;
    }

    const hrUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: 'HR',
      isActive: true,
    });

    // If companyIds provided, assign HR to those companies
    if (Array.isArray(companyIds) && companyIds.length > 0) {
      await Company.updateMany(
        { _id: { $in: companyIds } },
        { $addToSet: { hrUsers: hrUser._id } }
      );
    }

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'HR_CREATED',
      targetType: 'User',
      targetId: hrUser._id.toString(),
      details: `Created HR account ${hrUser.name} (${hrUser.email})`,
    });

    res.status(201).json({
      success: true,
      hrUser: {
        id: hrUser._id,
        name: hrUser.name,
        email: hrUser.email,
        phone: hrUser.phone,
        role: hrUser.role,
        isActive: hrUser.isActive,
      },
      message: 'HR account created successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHrAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, isActive, companyIds } = req.body;

    const hrUser = await User.findOne({ _id: id, role: 'HR' });
    if (!hrUser) {
      res.status(404).json({ success: false, message: 'HR account not found.' });
      return;
    }

    if (name) hrUser.name = name.trim();
    if (email) hrUser.email = email.trim().toLowerCase();
    if (phone) hrUser.phone = phone.trim();
    if (isActive !== undefined) hrUser.isActive = isActive;
    if (password && password.trim().length >= 6) {
      hrUser.password = password.trim();
    }

    await hrUser.save();

    // If companyIds provided, update assignments
    if (Array.isArray(companyIds)) {
      // Remove from all companies first
      await Company.updateMany(
        { hrUsers: hrUser._id },
        { $pull: { hrUsers: hrUser._id } }
      );
      // Add to selected companies
      if (companyIds.length > 0) {
        await Company.updateMany(
          { _id: { $in: companyIds } },
          { $addToSet: { hrUsers: hrUser._id } }
        );
      }
    }

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'HR_UPDATED',
      targetType: 'User',
      targetId: hrUser._id.toString(),
      details: `Updated HR account ${hrUser.name}`,
    });

    res.status(200).json({
      success: true,
      message: 'HR account updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Student Management
export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, course, branch, page = '1', limit = '15' } = req.query;

    const query: any = { role: 'STUDENT' };

    if (course && course !== 'ALL') {
      query.course = course;
    }

    if (branch && branch !== 'ALL') {
      query.branch = branch;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const [total, students] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    // Fetch applications count for each student
    const studentIds = students.map((s) => s._id);
    const applications = await Application.find({ studentId: { $in: studentIds } })
      .populate('companyId', 'name')
      .lean();

    const studentMap: Record<string, any[]> = {};
    applications.forEach((app) => {
      const sId = app.studentId.toString();
      if (!studentMap[sId]) studentMap[sId] = [];
      studentMap[sId].push(app);
    });

    const studentsWithApps = students.map((s) => ({
      ...s.toObject(),
      applications: studentMap[s._id.toString()] || [],
      applicationCount: (studentMap[s._id.toString()] || []).length,
    }));

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      students: studentsWithApps,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await User.findOne({ _id: id, role: 'STUDENT' }).select('-password');

    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    const applications = await Application.find({ studentId: id })
      .populate('companyId', 'name location website status')
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      student,
      applications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Application Management
export const getApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, status, course, branch, search, page = '1', limit = '15' } = req.query;

    const query: any = {};

    if (companyId && companyId !== 'ALL') {
      query.companyId = companyId;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    // Filter by student properties (search, course, branch)
    let studentFilter: any = { role: 'STUDENT' };
    let needsStudentMatch = false;

    if (course && course !== 'ALL') {
      studentFilter.course = course;
      needsStudentMatch = true;
    }
    if (branch && branch !== 'ALL') {
      studentFilter.branch = branch;
      needsStudentMatch = true;
    }
    if (search) {
      studentFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
      needsStudentMatch = true;
    }

    if (needsStudentMatch) {
      const matchingStudents = await User.find(studentFilter).select('_id');
      query.studentId = { $in: matchingStudents.map((s) => s._id) };
    }

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('studentId', 'name email phone rollNumber course branch semester')
        .populate('companyId', 'name location website status')
        .populate('assignedBy', 'name role')
        .populate('updatedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      applications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Activity Logs
export const getActivityLogs = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. CSV Export for Applications
export const exportApplicationsCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, status } = req.query;
    const query: any = {};
    if (companyId && companyId !== 'ALL') query.companyId = companyId;
    if (status && status !== 'ALL') query.status = status;

    const applications = await Application.find(query)
      .populate('studentId', 'name email phone rollNumber course branch semester')
      .populate('companyId', 'name location')
      .sort({ createdAt: -1 });

    const headers = [
      'Student Name',
      'Roll Number',
      'Email',
      'Phone',
      'Course',
      'Branch',
      'Semester',
      'Company Name',
      'Status',
      'Interview Date',
      'CTC',
      'Applied Date',
    ];

    const rows = applications.map((app: any) => [
      `"${app.studentId?.name || ''}"`,
      `"${app.studentId?.rollNumber || ''}"`,
      `"${app.studentId?.email || ''}"`,
      `"${app.studentId?.phone || ''}"`,
      `"${app.studentId?.course || ''}"`,
      `"${app.studentId?.branch || ''}"`,
      `"${app.studentId?.semester || ''}"`,
      `"${app.companyId?.name || ''}"`,
      `"${app.status || ''}"`,
      `"${app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : ''}"`,
      `"${app.ctc || ''}"`,
      `"${new Date(app.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="placement-applications.csv"');
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
