import mongoose from 'mongoose';

const TemporaryChangeoverSchema = new mongoose.Schema({
  // YYYY-MM-DD (local business date)
  workDate: {
    type: String,
    required: true
  },
  // Minutes to deduct from idle time for the given workDate
  durationMinutes: {
    type: Number,
    required: true,
    min: 0
  },
  note: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('TemporaryChangeover', TemporaryChangeoverSchema);
