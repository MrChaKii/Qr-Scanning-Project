import AttendanceLog from '../models/AttendanceLog.js';
import WorkSession from '../models/WorkSession.js';
import BreakSession from '../models/BreakSession.js';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';

const round2 = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
};

const parseYyyyMmDdToLocalDayRange = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error('date is required in format YYYY-MM-DD');
  }

  const parts = dateStr.split('-').map((n) => Number(n));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  const [year, month, day] = parts;
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { start, end };
};

const safeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const computeTotalBreakMinutesForRange = async ({ start, end, now }) => {
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  // BreakSession.startTime/endTime are stored as ISO strings.
  // ISO strings preserve chronological order in lexicographic comparisons.
  const breaks = await BreakSession.find({
    startTime: { $gte: startIso, $lte: endIso }
  })
    .select('startTime endTime')
    .lean();

  let total = 0;
  for (const brk of breaks) {
    const brkStart = safeDate(brk.startTime);
    if (!brkStart) continue;
    const brkEnd = safeDate(brk.endTime) || now;
    const minutes = (brkEnd.getTime() - brkStart.getTime()) / 60000;
    if (minutes > 0) total += minutes;
  }

  return total;
};

// GET /api/report/analytics/employee-idle/daily?date=YYYY-MM-DD
// idleMinutes = (checkOut - checkIn) - (workMinutes + breakMinutes)
export const getDailyEmployeeIdleTime = async (req, res) => {
  try {
    const { date } = req.query;
    const day = String(date || '');
    const { start, end } = parseYyyyMmDdToLocalDayRange(day);
    const now = new Date();

    const [checkInRows, checkOutRows] = await Promise.all([
      AttendanceLog.aggregate([
        {
          $match: {
            workDate: day,
            scanLocation: 'SECURITY',
            scanType: 'IN'
          }
        },
        {
          $group: {
            _id: '$employeeId',
            companyId: { $first: '$companyId' },
            checkInTime: { $min: '$scanTime' }
          }
        }
      ]),
      AttendanceLog.aggregate([
        {
          $match: {
            workDate: day,
            scanLocation: 'SECURITY',
            scanType: 'OUT'
          }
        },
        {
          $group: {
            _id: '$employeeId',
            checkOutTime: { $max: '$scanTime' }
          }
        }
      ])
    ]);

    const employeeIds = checkInRows.map((r) => r._id).filter(Boolean);

    if (employeeIds.length === 0) {
      return res.status(200).json({
        date: day,
        breakMinutes: 0,
        rows: []
      });
    }

    const checkInMap = new Map(checkInRows.map((r) => [String(r._id), r.checkInTime]));
    const companyIdFromAttendanceMap = new Map(
      checkInRows.map((r) => [String(r._id), r.companyId])
    );
    const checkOutMap = new Map(checkOutRows.map((r) => [String(r._id), r.checkOutTime]));

    const [workRows, breakMinutesRaw, employees] = await Promise.all([
      WorkSession.aggregate([
        {
          $match: {
            employeeId: { $in: employeeIds },
            startTime: { $gte: start, $lte: end }
          }
        },
        {
          $addFields: {
            durationMinutesEffective: {
              $cond: [
                { $ne: ['$durationMinutes', null] },
                '$durationMinutes',
                {
                  $cond: [
                    { $ne: ['$endTime', null] },
                    { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 60000] },
                    { $divide: [{ $subtract: [now, '$startTime'] }, 60000] }
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$employeeId',
            totalMinutes: { $sum: '$durationMinutesEffective' }
          }
        }
      ]),
      computeTotalBreakMinutesForRange({ start, end, now }),
      Employee.find({ _id: { $in: employeeIds } })
        .select('name employeeId employeeType companyId')
        .lean()
    ]);

    const workMinutesMap = new Map(workRows.map((r) => [String(r._id), Number(r.totalMinutes) || 0]));
    const employeeMap = new Map(employees.map((e) => [String(e._id), e]));

    const companyIds = Array.from(
      new Set(
        employees
          .map((e) => (e.companyId ? String(e.companyId) : null))
          .filter(Boolean)
      )
    );
    const companies = await Company.find({ _id: { $in: companyIds } })
      .select('companyName')
      .lean();
    const companyNameMap = new Map(companies.map((c) => [String(c._id), c.companyName]));

    const breakMinutes = Number(breakMinutesRaw) || 0;

    const rows = employeeIds
      .map((employeeObjectId) => {
        const key = String(employeeObjectId);
        const checkInTime = checkInMap.get(key);
        if (!checkInTime) return null;

        const employee = employeeMap.get(key) || {};
        const companyId = employee.companyId || companyIdFromAttendanceMap.get(key) || null;
        const companyName = companyId ? companyNameMap.get(String(companyId)) : null;

        const rawCheckOutTime = checkOutMap.get(key) || null;
        const effectiveCheckOutTime = rawCheckOutTime || now;

        const presenceMinutes =
          (effectiveCheckOutTime.getTime() - new Date(checkInTime).getTime()) / 60000;
        const workMinutes = workMinutesMap.get(key) || 0;
        const idleMinutesRaw = presenceMinutes - (workMinutes + breakMinutes);
        const idleMinutes = idleMinutesRaw < 0 ? 0 : idleMinutesRaw;

        return {
          employeeId: employeeObjectId,
          employeeCode: employee.employeeId || null,
          employeeName: employee.name || 'Unknown Employee',
          employeeType: employee.employeeType || null,
          companyId,
          companyName: companyName || 'Unknown Company',
          checkInTime,
          checkOutTime: rawCheckOutTime,
          isCheckedOut: Boolean(rawCheckOutTime),
          presenceMinutes: round2(presenceMinutes),
          workMinutes: round2(workMinutes),
          breakMinutes: round2(breakMinutes),
          idleMinutes: round2(idleMinutes),
          presenceHours: round2(presenceMinutes / 60),
          workHours: round2(workMinutes / 60),
          breakHours: round2(breakMinutes / 60),
          idleHours: round2(idleMinutes / 60)
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.idleMinutes || 0) - (a.idleMinutes || 0));

    return res.status(200).json({
      date: day,
      breakMinutes: round2(breakMinutes),
      rows
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Failed to compute daily employee idle time'
    });
  }
};
