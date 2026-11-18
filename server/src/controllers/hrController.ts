import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Application, ApplicationStatus } from '../models/Application';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../utils/activityLogger';

// Helper: Ensure user is authorized for company
const verifyCompanyAccess = async (userId: string | mongoose.Types.ObjectId, companyId: string) => {
  const company = await Company.findOne({
    _id: companyId,
    hrUsers: userId,
  });
  return company;
};

// 1. Get Assigned Companies for the logged-in HR
export const getMyCompanies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await Company.find({
      hrUsers: req.user!._id,
    }).sort({ name: 1 });

    res.status(200).json({ success: true, companies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. HR Dashboard Stats (Company-specific or all assigned companies)
export const getHrStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId } = req.query;

    // Get all company IDs assigned to this HR
    const myCompanies = await Company.find({ hrUsers: req.user!._id }).select('_id name');
    const myCompanyIds = myCompanies.map((c) => c._id);

    if (myCompanyIds.length === 0) {
      res.status(200).json({
        success: true,
        stats: {
          totalApplicants: 0,
          underReview: 0,
          shortlisted: 0,
          interviewScheduled: 0,
          interviewInProgress: 0,
          selected: 0,
          rejected: 0,
          onHold: 0,
        },
      });
      return;
    }

    const targetCompanyIds = companyId && companyId !== 'ALL'
      ? [new mongoose.Types.ObjectId(companyId as string)]
      : myCompanyIds;

    const [
      totalApplicants,
      underReview,
      shortlisted,
      interviewScheduled,
      interviewInProgress,
      selected,
      rejected,
      onHold,
    ] = await Promise.all([
      Application.countDocuments({ companyId: { $in: targetCompanyIds } }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'UNDER_REVIEW' }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'SHORTLISTED' }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'INTERVIEW_SCHEDULED' }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'INTERVIEW_IN_PROGRESS' }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'SELECTED' }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'REJECTED' }),
      Application.countDocuments({ companyId: { $in: targetCompanyIds }, status: 'ON_HOLD' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalApplicants,
        underReview,
        shortlisted,
        interviewScheduled,
        interviewInProgress,
        selected,
        rejected,
        onHold,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Applicants for assigned company
export const getApplicants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, status, course, branch, search, page = '1', limit = '15' } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId is required.' });
      return;
    }

    // Strict security check: verify HR is assigned to this company
    const hasAccess = await verifyCompanyAccess(req.user!._id, companyId as string);
    if (!hasAccess && req.user!.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied: You are not assigned to this company.',
      });
      return;
    }

    const query: any = { companyId };

    if (status && status !== 'ALL') {
      query.status = status;
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
        { phone: { $regex: search, $options: 'i' } },
      ];
      needsFilter = true;
    }

    if (needsFilter) {
      const matched = await User.find(studentFilter).select('_id');
      query.studentId = { $in: matched.map((s) => s._id) };
    }

    const [total, applicants] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate('studentId', 'name email phone rollNumber course branch semester')
        .populate('companyId', 'name location website')
        .populate('assignedBy', 'name role')
        .populate('updatedBy', 'name role')
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      applicants,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Application Status
export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, remarks, interviewDate, ctc, isRemarksVisibleToStudent } = req.body;

    const validStatuses: ApplicationStatus[] = [
      'APPLIED',
      'UNDER_REVIEW',
      'SHORTLISTED',
      'SELECTED',
      'REJECTED',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
      return;
    }

    const application = await Application.findById(id).populate('studentId companyId');
    if (!application) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    // Strict security check: verify HR is assigned to this company
    const hasAccess = await verifyCompanyAccess(
      req.user!._id,
      application.companyId._id.toString()
    );
    if (!hasAccess && req.user!.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied: You do not manage recruitment for this company.',
      });
      return;
    }

    const previousStatus = application.status;
    application.status = status;
    if (remarks !== undefined) application.remarks = remarks;
    if (interviewDate !== undefined) {
      application.interviewDate = interviewDate ? new Date(interviewDate) : undefined;
    }
    if (ctc !== undefined) application.ctc = ctc;
    if (isRemarksVisibleToStudent !== undefined) {
      application.isRemarksVisibleToStudent = Boolean(isRemarksVisibleToStudent);
    }
    application.updatedBy = req.user!._id;

    await application.save();

    await logActivity({
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'STATUS_CHANGED',
      targetType: 'Application',
      targetId: application._id.toString(),
      details: `Changed application status for ${(application.studentId as any)?.name} to ${status} (was ${previousStatus})`,
    });

    res.status(200).json({
      success: true,
      application,
      message: `Application status updated to ${status}.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. CSV Export for HR's company applicants
export const exportHrApplicantsCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyId, status } = req.query;

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId is required for export.' });
      return;
    }

    const company = await verifyCompanyAccess(req.user!._id, companyId as string);
    if (!company && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Access denied to this company.' });
      return;
    }

    const query: any = { companyId };
    if (status && status !== 'ALL') query.status = status;

    const applicants = await Application.find(query)
      .populate('studentId', 'name email phone rollNumber course branch semester')
      .sort({ createdAt: -1 });

    const headers = [
      'Student Name',
      'Roll Number',
      'Email',
      'Phone',
      'Course',
      'Branch',
      'Semester',
      'Status',
      'Interview Date',
      'CTC',
      'Remarks',
    ];

    const rows = applicants.map((app: any) => [
      `"${app.studentId?.name || ''}"`,
      `"${app.studentId?.rollNumber || ''}"`,
      `"${app.studentId?.email || ''}"`,
      `"${app.studentId?.phone || ''}"`,
      `"${app.studentId?.course || ''}"`,
      `"${app.studentId?.branch || ''}"`,
      `"${app.studentId?.semester || ''}"`,
      `"${app.status || ''}"`,
      `"${app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : ''}"`,
      `"${app.ctc || ''}"`,
      `"${app.remarks ? app.remarks.replace(/"/g, '""') : ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${company ? company.name.replace(/\s+/g, '_') : 'company'}_applicants.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
