import WorkSession from '../models/WorkSession.js';
import QRCode from '../models/QRCode.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';

const isMongoObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);

const resolveQRCode = async (qrId) => {
  if (!qrId) return null;
  if (isMongoObjectId(qrId)) {
    const byId = await QRCode.findById(qrId).populate('employeeId companyId');
    if (byId) return byId;
  }
  return QRCode.findOne({ qrId }).populate('employeeId companyId');
};

// GET /api/work-session/all
export const getAllSessions = async (req, res) => {
  try {
    const { date } = req.query;

    const query = {};
    if (date) {
      // Expect YYYY-MM-DD; interpret as local calendar date
      const parts = String(date).split('-').map(n => Number(n));
      if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
        return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
      }
      const [year, month, day] = parts;
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      query.startTime = { $gte: start, $lte: end };
    }

    const sessions = await WorkSession.find(query)
      .sort({ startTime: -1 })
      .populate('qrId companyId employeeId');
    res.status(200).json({
      message: 'All work sessions retrieved',
      sessions
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// POST /api/work-session/start
export const startSession = async (req, res) => {
  try {
    const { qrId, processName } = req.body;
    if (!qrId || !processName) {
      return res.status(400).json({ message: 'qrId and processName are required' });
    }
    // Find QR code and related info
    const qr = await resolveQRCode(qrId);
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    const qrObjectId = qr._id;
    const companyId = qr.companyId?._id || qr.companyId;
    const employeeId = qr.employeeId?._id || qr.employeeId || null;
    // const machineId = qr.machineId?._id || qr.machineId || null;
    // if (!machineId) {
    //   return res.status(400).json({ message: 'machineId must be present in QR code' });
    // }
    // Prevent overlapping sessions
    const openSession = await WorkSession.findOne({
      qrId: qrObjectId,
      processName,
      endTime: { $exists: false }
    });
    if (openSession) {
      return res.status(400).json({
        message: 'A work session is already in progress for this QR code and process.'
      });
    }

    // Block if employee is already assigned to another open process
    if (employeeId) {
      const parallelSession = await WorkSession.findOne({
        employeeId,
        endTime: { $exists: false }
      });
      if (parallelSession) {
        return res.status(400).json({
          message: 'Employee is already assigned to another open process.'
        });
      }
    }
    
    const session = new WorkSession({
      qrId: qrObjectId,
      companyId,
      employeeId,
      // machineId,
      processName,
      startTime: new Date()
    });
    await session.save();
    res.status(201).json({
      message: 'Work session started',
      session
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// POST /api/work-session/stop
export const stopSession = async (req, res) => {
  try {
    const { qrId, processName } = req.body;
    if (!qrId || !processName) {
      return res.status(400).json({ message: 'qrId and processName are required' });
    }
    // Find QR code and related info
    const qr = await resolveQRCode(qrId);
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found' });
    }
    const qrObjectId = qr._id;
    // Find open session
    const session = await WorkSession.findOne({
      qrId: qrObjectId,
      processName,
      endTime: { $exists: false }
    });
    if (!session) {
      return res.status(404).json({
        message: 'No open work session found for this QR code and process.'
      });
    }
    const now = new Date();
    session.endTime = now;
    session.durationMinutes = Math.round(
      (now - session.startTime) / 60000
    );
    await session.save();
    res.status(200).json({
      message: 'Work session ended',
      session
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};
