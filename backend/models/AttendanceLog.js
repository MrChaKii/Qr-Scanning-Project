import mongoose from 'mongoose';

const AttendanceLogSchema = new mongoose.Schema({
  qrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  scanType: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true
  },
  scanLocation: {
    type: String,
    enum: ['SECURITY'],
    required: true
  },
  scanTime: {
    type: Date,
    required: true
  },
  workDate: {
    type: String, // YYYY-MM-DD
    required: true
  }
});

export default mongoose.model('AttendanceLog', AttendanceLogSchema);
