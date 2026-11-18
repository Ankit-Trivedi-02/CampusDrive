import mongoose, { Document, Schema } from 'mongoose';

export type CompanyStatus = 'UPCOMING' | 'ACTIVE' | 'CLOSED';

export interface ICompany extends Document {
  name: string;
  description: string;
  website: string;
  location: string;
  hrUsers: mongoose.Types.ObjectId[];
  applicationDeadline?: Date;
  driveDate?: Date;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    hrUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    applicationDeadline: {
      type: Date,
    },
    driveDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'CLOSED'],
      default: 'UPCOMING',
    },
  },
  {
    timestamps: true,
  }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
