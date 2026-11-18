import mongoose, { Document, Schema } from 'mongoose';

export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'REJECTED';

export interface IApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;
  status: ApplicationStatus;
  interviewDate?: Date;
  ctc?: string;
  remarks?: string;
  isRemarksVisibleToStudent: boolean;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: [
        'APPLIED',
        'UNDER_REVIEW',
        'SHORTLISTED',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_IN_PROGRESS',
        'SELECTED',
        'REJECTED',
        'ON_HOLD',
      ],
      default: 'APPLIED',
    },
    interviewDate: {
      type: Date,
    },
    ctc: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    isRemarksVisibleToStudent: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate applications
ApplicationSchema.index({ studentId: 1, companyId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
