import mongoose from 'mongoose';

const plannedAttendanceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  plannedCount: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a single record per company per date
plannedAttendanceSchema.index({ companyId: 1, date: 1 }, { unique: true });

export default mongoose.models.PlannedAttendance || mongoose.model('PlannedAttendance', plannedAttendanceSchema);
