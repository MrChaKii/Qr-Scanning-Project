import AttendanceLog from '../models/AttendanceLog.js';
import QRCode from '../models/QRCode.js';
import Employee from '../models/Employee.js';
import Company from '../Models/Company.js';

// POST /api/attendance/scan
export const scanAtSecurity = async (req, res) => {
  try {
    const { qrId, scanType } = req.body;
    if (!qrId) {
      return res.status(400).json({ message: 'qrId is required' });
    }

    // Find QR code and related info
    const qr = await QRCode.findById(qrId).populate('employeeId companyId');
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    const companyId = qr.companyId?._id || qr.companyId;
    const employeeId = qr.employeeId?._id || qr.employeeId || null;

    const now = new Date();
    const workDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Accept scanType from request, default to alternating if not provided
    let type = scanType;
    if (!type) {
      // Find all security scans for today
      const logs = await AttendanceLog.find({
        qrId,
        companyId,
        workDate,
        scanLocation: 'SECURITY'
      }).sort({ scanTime: 1 });
      if (logs.length === 0) {
        type = 'IN';
      } else {
        // Alternate between IN and OUT
        const last = logs[logs.length - 1];
        type = last.scanType === 'IN' ? 'OUT' : 'IN';
      }
    }

    const attendance = new AttendanceLog({
      qrId,
      companyId,
      employeeId,
      scanType: type,
      scanLocation: 'SECURITY',
      scanTime: now,
      workDate
    });

    await attendance.save();

    res.status(201).json({
      message: `Attendance ${type} recorded`,
      attendance
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// GET /api/attendance/summary?qrId=...&date=YYYY-MM-DD
export const getAttendanceSummary = async (req, res) => {
  try {
    const { qrId, workDate, date } = req.query;
    const day = workDate || date;
    if (!qrId || !day) {
      return res.status(400).json({ message: 'qrId and workDate (or date) are required' });
    }

    const logs = await AttendanceLog.find({
      qrId,
      workDate: day,
      scanLocation: 'SECURITY'
    }).sort({ scanTime: 1 });

    const firstIn = logs.find(l => l.scanType === 'IN');
    const lastOut = [...logs].reverse().find(l => l.scanType === 'OUT');

    res.status(200).json({
      firstIn,
      lastOut
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};
