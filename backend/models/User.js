import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'security'],
    required: true
  },
  email: {
    type: String
  },
  contactNumber: {
    type: String
  },
  assignedProcesses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Process'
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("User", userSchema);
