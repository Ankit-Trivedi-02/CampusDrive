import mongoose from 'mongoose';
import { ActivityLog } from '../models/ActivityLog';

interface LogActivityParams {
  actorId: mongoose.Types.ObjectId | string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
}

export const logActivity = async (params: LogActivityParams): Promise<void> => {
  try {
    await ActivityLog.create({
      actor: new mongoose.Types.ObjectId(params.actorId),
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details || '',
    });
  } catch (error) {
    console.error('[ActivityLog] Failed to record log:', error);
  }
};
