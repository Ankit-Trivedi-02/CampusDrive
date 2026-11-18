import { Response } from 'express';
import { User, IUser } from '../models/User';
import { Company } from '../models/Company';
import { Application } from '../models/Application';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

// 1. Dashboard Stats
export const getCoordinatorStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalStudents, totalCompanies, totalApplications] = await Promise.all([
      User.countDocuments({ role: 'STUDENT' }),
      Company.countDocuments({ status: { $in: ['UPCOMING', 'ACTIVE'] } }),
      Application.countDocuments(),
    ]);

    // Course-wise student count
    const courseStats = await User.aggregate([
      { $match: { role: 'STUDENT' } },
      {
        $group: {
          _id: { $ifNull: ['$course', 'Unassigned'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Branch-wise student count
    const branchStats = await User.aggregate([
      { $match: { role: 'STUDENT' } },
      {
        $group: {
          _id: { $ifNull: ['$branch', 'Unassigned'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalCompanies,
        totalApplications,
        courseStats,
        branchStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Student Management
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

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, rollNumber, course, branch, semester, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required.',
      });
      return;
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      res.status(400).json({ success: false, message: 'Student with this email already exists.' });
      return;
    }

    const normalizedRollNumber = typeof rollNumber === 'string' ? rollNumber.trim() : '';
    if (normalizedRollNumber) {
      const existingRoll = await User.findOne({ rollNumber: normalizedRollNumber });
      if (existingRoll) {
        res.status(400).json({ success: false, message: 'Student with this roll number already exists.' });
        return;
      }
    }

    const student = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      rollNumber: normalizedRollNumber,
      course: course || '',
      branch: branch || '',
      semester: semester || '',
      password,
      role: 'STUDENT',
      isActive: true,
    });

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'STUDENT_CREATED',
      targetType: 'User',
      targetId: student._id.toString(),
      details: `Created student ${student.name} (${student.rollNumber})`,
    });

    res.status(201).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        rollNumber: student.rollNumber,
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        role: student.role,
        isActive: student.isActive,
      },
      message: 'Student account created successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, rollNumber, course, branch, semester, isActive, password } = req.body;

    const student = await User.findOne({ _id: id, role: 'STUDENT' });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    if (name) student.name = name.trim();
    if (email) student.email = email.trim().toLowerCase();
    if (phone) student.phone = phone.trim();
    if (rollNumber) student.rollNumber = rollNumber.trim();
    if (course !== undefined) student.course = course;
    if (branch !== undefined) student.branch = branch;
    if (semester !== undefined) student.semester = semester;
    if (isActive !== undefined) student.isActive = isActive;
    if (password && password.trim().length >= 6) {
      student.password = password.trim();
    }

    await student.save();

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'STUDENT_UPDATED',
      targetType: 'User',
      targetId: student._id.toString(),
      details: `Updated student ${student.name} (${student.rollNumber})`,
    });

    res.status(200).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        rollNumber: student.rollNumber,
        course: student.course,
        branch: student.branch,
        semester: student.semester,
        role: student.role,
        isActive: student.isActive,
      },
      message: 'Student updated successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Make Application (Assign student to company)
export const createApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, companyId } = req.body;

    if (!studentId || !companyId) {
      res.status(400).json({
        success: false,
        message: 'Student and Company are both required to make an application.',
      });
      return;
    }

    // Check student existence
    const student = await User.findOne({ _id: studentId, role: 'STUDENT' });
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found.' });
      return;
    }

    // Check company existence
    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    // Prevent duplicate application
    const existingApplication = await Application.findOne({ studentId, companyId });
    if (existingApplication) {
      res.status(409).json({
        success: false,
        message: `Student "${student.name}" has already been assigned/applied to "${company.name}". Duplicate applications are not allowed.`,
      });
      return;
    }

    const application = await Application.create({
      studentId,
      companyId,
      assignedBy: req.user!._id,
      status: 'APPLIED',
      remarks: '',
      isRemarksVisibleToStudent: true,
    });

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'APPLICATION_CREATED',
      targetType: 'Application',
      targetId: application._id.toString(),
      details: `Assigned student ${student.name} (${student.rollNumber}) to ${company.name}`,
    });

    const populated = await Application.findById(application._id)
      .populate('studentId', 'name email rollNumber course branch semester')
      .populate('companyId', 'name location website status');

    res.status(201).json({
      success: true,
      application: populated,
      message: `Student ${student.name} assigned to ${company.name} successfully.`,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'Duplicate application detected: This student already has an application for this company.',
      });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. View Coordinator Applications
export const getApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, search, course, branch, page = '1', limit = '15' } = req.query;

    const query: any = {};
    if (companyId && companyId !== 'ALL') {
      query.companyId = companyId;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    let studentFilter: any = { role: 'STUDENT' };
    let needsFilter = false;

    if (course && course !== 'ALL') {
      studentFilter.course = course;
      needsFilter = true;
    }
    if (branch && branch !== 'ALL') {
      studentFilter.branch = branch;
      needsFilter = true;
    }
    if (search) {
      studentFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      needsFilter = true;
    }

    if (needsFilter) {
      const matched = await User.find(studentFilter).select('_id');
      query.studentId = { $in: matched.map((s) => s._id) };
    }

    const [total, applications] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('studentId', 'name email phone rollNumber course branch semester')
        .populate('companyId', 'name location website status')
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    // Sanitization: Coordinator cannot view confidential HR selection remarks or final confidential details
    const sanitizedApplications = applications.map((app: any) => ({
      _id: app._id,
      studentId: app.studentId,
      companyId: app.companyId,
      assignedBy: app.assignedBy,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      // Note: remarks and CTC hidden from coordinator per requirement:
      // "Coordinator cannot view confidential HR selection remarks or final selection details."
    }));

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      applications: sanitizedApplications,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Companies list for dropdown
export const getAvailableCompanies = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await Company.find({ status: { $ne: 'CLOSED' } })
      .select('_id name location status driveDate applicationDeadline')
      .sort({ name: 1 });
    res.status(200).json({ success: true, companies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
