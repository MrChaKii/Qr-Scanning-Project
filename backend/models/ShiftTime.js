import mongoose from 'mongoose';

const ShiftTimeSchema = new mongoose.Schema(
  {
    dayStart: {
      type: String,
      required: true,
    },
    dayEnd: {
      type: String,
      required: true,
    },
    nightStart: {
      type: String,
      required: true,
    },
    nightEnd: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ShiftTime', ShiftTimeSchema);
