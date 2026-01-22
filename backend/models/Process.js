import mongoose from 'mongoose';

const processSchema = new mongoose.Schema({
  processId: {
    type: String,
    unique: true,
    required: true
  },
  processName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Process || mongoose.model('Process', processSchema);
