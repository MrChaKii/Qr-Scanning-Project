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
  shift: {
    type: String,
    enum: ['Day', 'Night'],
    required: true,
    default: 'Day'
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

// Allow separate Day and Night plans for the same company and date.
plannedAttendanceSchema.index({ companyId: 1, date: 1, shift: 1 }, { unique: true });

export default mongoose.models.PlannedAttendance || mongoose.model('PlannedAttendance', plannedAttendanceSchema);
