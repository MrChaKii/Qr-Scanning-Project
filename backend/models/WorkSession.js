import mongoose from 'mongoose';

const WorkSessionSchema = new mongoose.Schema({
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
  // machineId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Machine',
  //   required: true
  // },
  processName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  durationMinutes: {
    type: Number
  }
});

export default mongoose.model('WorkSession', WorkSessionSchema);
