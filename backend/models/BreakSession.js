import mongoose from 'mongoose';

const BreakSessionSchema = new mongoose.Schema({
  // Break sessions are now global, not per employee or QR
  breakType: {
    type: String,
    enum: ['LUNCH', 'TEA', 'CLOTHES'],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  }
});

export default mongoose.model('BreakSession', BreakSessionSchema);
