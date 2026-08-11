import mongoose from 'mongoose';

// HH:MM regex for 24-hour time validation
const HH_MM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * A BreakSession represents a named break that occurs at the same wall-clock
 * time every working day (e.g. Lunch 12:00–13:00).
 *
 * startTime / endTime are stored as "HH:MM" strings so they are
 * date-independent and apply to every day automatically.
 *
 * durationMinutes is stored explicitly so analytics queries remain simple
 * (no need to parse and diff strings at query time).
 */
const BreakSessionSchema = new mongoose.Schema({
  breakType: {
    type: String,
    enum: ['BREAKFAST', 'MID NIGHT', 'DINNER', 'LUNCH', 'TEA', 'MORNING MEETING'],
    required: true
  },
  // Wall-clock start time in "HH:MM" 24-hour format, e.g. "08:00"
  startTime: {
    type: String,
    required: true,
    match: [HH_MM_RE, 'startTime must be in HH:MM format (24-hour)']
  },
  // Wall-clock end time in "HH:MM" 24-hour format, e.g. "08:30"
  endTime: {
    type: String,
    required: true,
    match: [HH_MM_RE, 'endTime must be in HH:MM format (24-hour)']
  },
  // Pre-computed duration so analytics can sum quickly without string parsing
  durationMinutes: {
    type: Number,
    min: 0
  }
});

/**
 * Before saving, always recompute durationMinutes from startTime/endTime.
 */
BreakSessionSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    this.durationMinutes = duration > 0 ? duration : 0;
  }
  next();
});

export default mongoose.model('BreakSession', BreakSessionSchema);
