import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const admins = [
  { name: 'Virendra Kushwaha', email: 'rum2425442@ramauniversity.ac.in', phone: '9369240677', password: 'VirendraPassword123!' },
  { name: 'Ankit Trivedi', email: 'rum2425515@ramauniversity.ac.in', phone: '902682038', password: 'AnkitPassword123!' },
  { name: 'Anjali', email: 'ranjaligurjar399@gmail.com', phone: '9528530480', password: 'AnjaliPassword123!' },
  { name: 'AbhayShukla', email: 'deanfet@ramauniversity.ac.in', phone: '1111116699', password: 'DeanPassword123!' },
];

const seedAdmins = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_recruitment';
  await mongoose.connect(mongoUri);

  for (const admin of admins) {
    const email = admin.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Skipped existing account: ${email}`);
      continue;
    }

    await User.create({ ...admin, email, role: 'ADMIN', isActive: true });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
};

seedAdmins().catch(async (error) => {
  console.error('Admin seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
