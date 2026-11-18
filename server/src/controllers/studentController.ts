import { Response } from 'express';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Application } from '../models/Application';
import { AuthRequest } from '../middleware/auth';

// 1. Student Dashboard & Profile
export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!._id;

    const student = await User.findById(studentId).select('-password');
    if (!student) {
      res.status(404).json({ success: false, message: 'Student profile not found.' });
      return;
    }

    const [totalApplied, underReview, shortlisted, selected] = await Promise.all([
      Application.countDocuments({ studentId }),
      Application.countDocuments({ studentId, status: { $in: ['APPLIED', 'UNDER_REVIEW'] } }),
      Application.countDocuments({
        studentId,
        status: { $in: ['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_IN_PROGRESS'] },
      }),
      Application.countDocuments({ studentId, status: 'SELECTED' }),
    ]);

    res.status(200).json({
      success: true,
      profile: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        phone: student.phone,
        course: student.course,
        branch: student.branch,
        semester: student.semester,
      },
      stats: {
        totalApplied,
        underReview,
        shortlisted,
        selected,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Student Applications
export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!._id;

    const applications = await Application.find({ studentId })
      .populate('companyId', 'name description website location driveDate applicationDeadline status')
      .sort({ createdAt: -1 })
      .lean();

    // Mask internal remarks if isRemarksVisibleToStudent is false
    const sanitized = applications.map((app: any) => ({
      _id: app._id,
      company: app.companyId,
      status: app.status,
      interviewDate: app.interviewDate,
      ctc: app.status === 'SELECTED' ? app.ctc : undefined,
      remarks: app.isRemarksVisibleToStudent ? app.remarks : '',
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    res.status(200).json({
      success: true,
      applications: sanitized,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Upcoming / Active Companies
export const getUpcomingCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!._id;

    // Fetch UPCOMING and ACTIVE companies
    const companies = await Company.find({
      status: { $in: ['UPCOMING', 'ACTIVE'] },
    })
      .select('name description website location applicationDeadline driveDate status')
      .sort({ driveDate: 1, applicationDeadline: 1 })
      .lean();

    // Check which companies this student has already applied to
    const myApplications = await Application.find({ studentId }).select('companyId status');
    const appliedMap = new Map<string, string>();
    myApplications.forEach((app) => {
      appliedMap.set(app.companyId.toString(), app.status);
    });

    const enriched = companies.map((c) => ({
      ...c,
      hasApplied: appliedMap.has(c._id.toString()),
      applicationStatus: appliedMap.get(c._id.toString()) || null,
    }));

    res.status(200).json({
      success: true,
      companies: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
