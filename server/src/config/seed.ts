import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Application } from '../models/Application';
import { ActivityLog } from '../models/ActivityLog';

dotenv.config();

const seed = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_recruitment';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  await mongoose.connect(mongoUri);

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Application.deleteMany({}),
    ActivityLog.deleteMany({}),
  ]);

  console.log('Seeding initial data...');

  // 1. Admin Account
  const admin = await User.create({
    name: 'University Placement Admin',
    email: 'admin@placement.edu',
    phone: '9999999999',
    password: 'AdminPassword123!',
    role: 'ADMIN',
    isActive: true,
  });
  console.log('Admin account created: admin@placement.edu / AdminPassword123!');

  // 2. Demo Coordinator Account
  const coordinator = await User.create({
    name: 'Prof. Rajesh Sharma',
    email: 'coordinator@placement.edu',
    phone: '9888888888',
    password: 'Coordinator123!',
    role: 'COORDINATOR',
    course: 'BTECH',
    branch: 'CSE',
    isActive: true,
  });
  console.log('Coordinator created: coordinator@placement.edu / Coordinator123!');

  // 3. Demo HR Account
  const hrUser = await User.create({
    name: 'Priya Verma (HR)',
    email: 'hr@infosys.com',
    phone: '9777777777',
    password: 'HrPassword123!',
    role: 'HR',
    isActive: true,
  });
  console.log('HR created: hr@infosys.com / HrPassword123!');

  // 4. Demo Companies
  const infosys = await Company.create({
    name: 'Infosys Technologies',
    description: 'Global leader in next-generation digital services and consulting.',
    website: 'https://www.infosys.com',
    location: 'Bengaluru / Pune',
    hrUsers: [hrUser._id],
    applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    driveDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    status: 'ACTIVE',
  });

  const google = await Company.create({
    name: 'Google India',
    description: 'Leading global technology company organizing world information.',
    website: 'https://careers.google.com',
    location: 'Hyderabad / Bengaluru',
    hrUsers: [],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    driveDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    status: 'UPCOMING',
  });

  // 5. Demo Students
  const student1 = await User.create({
    name: 'Aarav Patel',
    email: 'aarav.patel@student.edu',
    phone: '9111111111',
    rollNumber: '2023BTCS001',
    password: 'Student123!',
    role: 'STUDENT',
    course: 'BTECH',
    branch: 'CSE',
    semester: '7th',
    isActive: true,
  });

  const student2 = await User.create({
    name: 'Ananya Gupta',
    email: 'ananya.gupta@student.edu',
    phone: '9222222222',
    rollNumber: '2023BTCS002',
    password: 'Student123!',
    role: 'STUDENT',
    course: 'BTECH',
    branch: 'ECE',
    semester: '7th',
    isActive: true,
  });

  const student3 = await User.create({
    name: 'Rohan Mehra',
    email: 'rohan.mehra@student.edu',
    phone: '9333333333',
    rollNumber: '2023MCA015',
    password: 'Student123!',
    role: 'STUDENT',
    course: 'MCA',
    branch: 'Computer Applications',
    semester: '3rd',
    isActive: true,
  });

  // 6. Demo Applications
  await Application.create({
    studentId: student1._id,
    companyId: infosys._id,
    assignedBy: coordinator._id,
    status: 'SHORTLISTED',
    interviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    remarks: 'Profile shortlisted for technical round 1 on Zoom.',
    isRemarksVisibleToStudent: true,
    updatedBy: hrUser._id,
  });

  await Application.create({
    studentId: student2._id,
    companyId: infosys._id,
    assignedBy: coordinator._id,
    status: 'APPLIED',
    remarks: '',
    isRemarksVisibleToStudent: true,
  });

  // 7. Initial Activity Logs
  await ActivityLog.create([
    {
      actor: admin._id,
      actorName: admin.name,
      actorRole: admin.role,
      action: 'SYSTEM_SEEDED',
      targetType: 'System',
      details: 'Initial portal environment configured and seeded.',
    },
    {
      actor: coordinator._id,
      actorName: coordinator.name,
      actorRole: coordinator.role,
      action: 'APPLICATION_CREATED',
      targetType: 'Application',
      details: `Assigned student ${student1.name} to ${infosys.name}`,
    },
    {
      actor: hrUser._id,
      actorName: hrUser.name,
      actorRole: hrUser.role,
      action: 'STATUS_CHANGED',
      targetType: 'Application',
      details: `Updated application for ${student1.name} to SHORTLISTED`,
    },
  ]);

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log('Demo Credentials for Instant Testing:');
  console.log('ADMIN:       admin@placement.edu      / AdminPassword123!');
  console.log('COORDINATOR: coordinator@placement.edu / Coordinator123!');
  console.log('HR:          hr@infosys.com           / HrPassword123!');
  console.log('STUDENT:     aarav.patel@student.edu  / Student123!');
  console.log('--------------------------------------\n');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
