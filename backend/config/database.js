import dns from 'node:dns';
import mongoose from 'mongoose';
import PlannedAttendance from '../models/PlannedAttendance.js';

const connectDB = async () => {
  try {
    if (process.env.MONGODB_DNS_SERVERS) {
      dns.setServers(
        process.env.MONGODB_DNS_SERVERS
          .split(',')
          .map((server) => server.trim())
          .filter(Boolean)
      );
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await PlannedAttendance.syncIndexes();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
export default connectDB;
