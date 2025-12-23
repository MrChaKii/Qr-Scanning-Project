import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  companyId: {
    type: String,
    unique: true,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  employeeTypeAllowed: {
    type: String,
    enum: ['manpower', 'permanent'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Company', companySchema);
