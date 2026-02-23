import AttendanceLog from '../models/AttendanceLog.js';
import QRCode from '../models/QRCode.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';

const toWorkDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

// GET /api/attendance/recent?limit=10
export const getRecentAttendanceLogs = async (req, res) => {
  try {
    const rawLimit = req.query?.limit;
    const limit = Math.max(1, Math.min(100, Number(rawLimit) || 10));

    const logs = await AttendanceLog.find({ scanLocation: 'SECURITY' })
      .sort({ scanTime: -1 })
      .limit(limit)
      .populate('employeeId companyId');

    return res.status(200).json(logs);
  } catch (err) {
    return res.status(500).json({
      message: 'Error fetching recent attendance logs',
      error: err.message,
    });
  }
};

// POST /api/attendance/scan
export const scanAtSecurity = async (req, res) => {
  console.log('🔍 scanAtSecurity called with:', req.body);
  try {
    const { qrId, scanType, context, employeeId: employeeIdOverride } = req.body;
    
    if (!qrId) {
      return res.status(400).json({ message: 'qrId is required' });
    }

    // Validate context if it's required
    if (!context) {
      return res.status(400).json({ message: 'context is required' });
    }

    // AttendanceLog.scanLocation is currently restricted to SECURITY
    if (context !== 'SECURITY') {
      return res.status(400).json({ message: 'Invalid context. Expected SECURITY' });
    }

    // Try to find QRCode by _id (MongoDB ObjectId), if fails, try by qrId field (UUID)
    let qr = null;
    if (/^[a-fA-F0-9]{24}$/.test(qrId)) {
      qr = await QRCode.findById(qrId).populate('employeeId companyId');
    }
    if (!qr) {
      qr = await QRCode.findOne({ qrId: qrId }).populate('employeeId companyId');
    }
    if (!qr) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    const companyId = qr.companyId?._id || qr.companyId;
    let employeeId = qr.employeeId?._id || qr.employeeId || null;

    // For shared manpower QR codes, QRCode.employeeId can be null.
    // If the QR payload included a specific employee ObjectId, prefer it.
    if (typeof employeeIdOverride === 'string' && /^[a-fA-F0-9]{24}$/.test(employeeIdOverride)) {
      const employee = await Employee.findById(employeeIdOverride).select('companyId');
      if (!employee) {
        return res.status(400).json({ message: 'Invalid employeeId' });
      }
      if (employee.companyId?.toString() !== companyId?.toString()) {
        return res.status(400).json({ message: 'Employee does not belong to this company' });
      }
      employeeId = employee._id;
    }

    // Do not allow attendance scans without a specific employee.
    // This prevents AttendanceLog.employeeId from being saved as null.
    if (!employeeId) {
      return res.status(400).json({
        message:
          'This QR code is not linked to a specific employee. Please scan an employee QR code, or include a valid employeeId override.',
      });
    }

    const now = new Date();
    const workDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Accept scanType from request, default to alternating if not provided
    let type = scanType;
    if (!type) {
      // Find all scans for today with this context
      const logs = await AttendanceLog.find({
        qrId: qr._id,  // Use QRCode's MongoDB _id, not the UUID
        companyId,
        workDate,
        scanLocation: context // ✅ Use context instead of hardcoded 'SECURITY'
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
      qrId: qr._id,  // Use QRCode's MongoDB _id, not the UUID
      companyId,
      employeeId,
      scanType: type,
      scanLocation: context, // ✅ Use context instead of hardcoded 'SECURITY'
      scanTime: now,
      workDate
    });

    await attendance.save();

    res.status(201).json({
      message: `Attendance ${type} recorded at ${context}`,
      attendance
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// PUT /api/attendance/logs/:id/scan-time
// Admin-only: update the scanTime (check-in/check-out time) for an existing attendance log.
export const updateAttendanceLogScanTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { scanTime } = req.body;

    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid attendance log id' });
    }

    if (!scanTime) {
      return res.status(400).json({ message: 'scanTime is required' });
    }

    const parsed = new Date(scanTime);
    if (Number.isNaN(parsed.getTime())) {
      return res.status(400).json({ message: 'scanTime must be a valid date/time' });
    }

    const log = await AttendanceLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Attendance log not found' });
    }

    // Only allow editing SECURITY attendance logs via this endpoint.
    if (log.scanLocation !== 'SECURITY') {
      return res.status(400).json({ message: 'Only SECURITY attendance logs can be edited here' });
    }

    log.scanTime = parsed;
    const newWorkDate = toWorkDate(parsed);
    if (!newWorkDate) {
      return res.status(400).json({ message: 'Failed to compute workDate from scanTime' });
    }
    log.workDate = newWorkDate;
    log.editedAt = new Date();
    if (req.userId) {
      log.editedBy = req.userId;
    }

    await log.save();

    return res.status(200).json({
      message: 'Attendance time updated successfully',
      attendance: log,
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Error updating attendance time',
      error: err.message,
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
    res.status(500).json({ message: 'Error fetching summary', error: err.message });
  }
};

// GET /api/attendance/daily-summary?date=YYYY-MM-DD
export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'date is required' });
    }
    // Find all attendance logs for the date
    const logs = await AttendanceLog.find({ workDate: date, scanLocation: 'SECURITY' }).populate('employeeId companyId');
    // Group by employee
    const summary = {};
    logs.forEach(log => {
      const empId = log.employeeId?._id?.toString() || (log.employeeId && log.employeeId.toString()) || 'unknown';
      if (!summary[empId]) {
        summary[empId] = {
          employee: log.employeeId,
          company: log.companyId,
          logs: []
        };
      }
      summary[empId].logs.push(log);
    });
    // For each employee, get first IN and last OUT
    const result = Object.values(summary).map(({ employee, company, logs }) => {
      const firstIn = logs.find(l => l.scanType === 'IN');
      const lastOut = [...logs].reverse().find(l => l.scanType === 'OUT');
      return {
        employee,
        company,
        firstIn,
        lastOut
      };
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching daily summary', error: err.message });
  }
};
//   } catch (err) {
//     res.status(500).json({
//       message: 'Server error',
//       error: err.message
//     });
//   }
// };
