import mongoose from 'mongoose';

const BreakSessionSchema = new mongoose.Schema({
  // Break sessions are now global, not per employee or QR
  breakType: {
    type: String,
    enum: ['BREAKFAST', 'LUNCH', 'TEA', 'CLOTHES'],
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String
  }
});

export default mongoose.model('BreakSession', BreakSessionSchema);
