import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { Company } from '../models/Company';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_campus_portal_2026_change_in_production';

    const decoded = jwt.verify(token, secret) as { id: string; role: string };
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated. Please contact admin.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Role [${req.user.role}] is not authorized for this resource.`,
      });
      return;
    }

    next();
  };
};

// Middleware to verify that the logged-in HR is assigned to the company
export const verifyHrCompanyOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    // Admins bypass this check
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.role !== 'HR') {
      res.status(403).json({ success: false, message: 'Access denied: Must be an HR account.' });
      return;
    }

    const companyId = req.params.companyId || req.body.companyId || req.query.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, message: 'Company ID is required to verify ownership.' });
      return;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found.' });
      return;
    }

    const isAssigned = company.hrUsers.some(
      (hrId) => hrId.toString() === req.user!._id.toString()
    );

    if (!isAssigned) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have HR permissions for this company.',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying HR company assignment.' });
  }
};
