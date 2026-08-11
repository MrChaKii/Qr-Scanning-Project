import AttendanceLog from '../models/AttendanceLog.js';
import WorkSession from '../models/WorkSession.js';
import BreakSession from '../models/BreakSession.js';
import TemporaryChangeover from '../models/TemporaryChangeover.js';
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

const HH_MM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Compute total break minutes for a given calendar date.
 *
 * Break sessions are date-independent: they store "HH:MM" start/end times
 * that apply to every working day.  For each break we compute how many
 * minutes of the queried day fall inside [breakStart, breakEnd].
 *
 * Legacy records (ISO datetime strings or durationMinutes-only) are handled
 * with backward-compatible fallback logic.
 */
const computeBreakMinutesForWindow = ({ breaks, windowStart, windowEnd, now }) => {
  if (!windowStart || !windowEnd) return 0;

  const start = new Date(windowStart);
  const end = new Date(windowEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return 0;
  }

  let total = 0;
  const currentDay = new Date(start);
  currentDay.setHours(0, 0, 0, 0);

  const lastDay = new Date(end);
  lastDay.setHours(0, 0, 0, 0);

  for (let day = new Date(currentDay); day.getTime() <= lastDay.getTime(); day.setDate(day.getDate() + 1)) {
    for (const brk of breaks) {
      if (HH_MM_RE.test(brk.startTime) && HH_MM_RE.test(brk.endTime)) {
        const [sh, sm] = brk.startTime.split(':').map(Number);
        const [eh, em] = brk.endTime.split(':').map(Number);

        const brkStart = new Date(day);
        brkStart.setHours(sh, sm, 0, 0);

        const brkEnd = new Date(day);
        brkEnd.setHours(eh, em, 0, 0);
        if (brkEnd.getTime() <= brkStart.getTime()) {
          brkEnd.setDate(brkEnd.getDate() + 1);
        }

        const overlapStart = brkStart < start ? start : brkStart;
        const overlapEnd = brkEnd > end ? end : brkEnd;

        const minutes = (overlapEnd.getTime() - overlapStart.getTime()) / 60000;
        if (minutes > 0) total += minutes;
        continue;
      }

      const storedDuration = brk?.durationMinutes;
      if (storedDuration !== undefined && storedDuration !== null) {
        const n = Number(storedDuration);
        if (!Number.isNaN(n) && n > 0) total += n;
        continue;
      }

      const brkStart = safeDate(brk.startTime);
      if (!brkStart) continue;
      const brkEnd = safeDate(brk.endTime) || now;
      const minutes = (brkEnd.getTime() - brkStart.getTime()) / 60000;
      if (minutes > 0) total += minutes;
    }
  }

  return total;
};

const computeTotalBreakMinutesForRange = async ({ workDate, start, end, now }) => {
  const breaks = await BreakSession.find()
    .select('startTime endTime durationMinutes')
    .lean();

  const changeovers = workDate
    ? await TemporaryChangeover.find({ workDate: String(workDate) })
        .select('durationMinutes')
        .lean()
    : [];

  let total = computeBreakMinutesForWindow({ breaks, windowStart: start, windowEnd: end, now });

  for (const ch of changeovers) {
    const n = Number(ch?.durationMinutes);
    if (!Number.isNaN(n) && n > 0) total += n;
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
    const endNextDay = new Date(end);
    endNextDay.setDate(endNextDay.getDate() + 1);
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
            scanLocation: 'SECURITY',
            scanType: 'OUT',
            scanTime: { $gte: start, $lte: endNextDay }
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

    const breaks = await BreakSession.find()
      .select('startTime endTime durationMinutes')
      .lean();

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
      computeTotalBreakMinutesForRange({ workDate: day, start, end, now }),
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

        const candidateCheckOutTime = checkOutMap.get(key) || null;
        const rawCheckOutTime =
          candidateCheckOutTime && new Date(candidateCheckOutTime) > new Date(checkInTime)
            ? candidateCheckOutTime
            : null;
        const effectiveCheckOutTime = rawCheckOutTime || now;

        const presenceMinutes =
          (effectiveCheckOutTime.getTime() - new Date(checkInTime).getTime()) / 60000;
        const workMinutes = workMinutesMap.get(key) || 0;
        const breakMinutesForEmployee = computeBreakMinutesForWindow({
          breaks,
          windowStart: new Date(checkInTime),
          windowEnd: effectiveCheckOutTime,
          now
        });
        const idleMinutesRaw = presenceMinutes - (workMinutes + breakMinutesForEmployee);
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
          breakMinutes: round2(breakMinutesForEmployee),
          idleMinutes: round2(idleMinutes),
          presenceHours: round2(presenceMinutes / 60),
          workHours: round2(workMinutes / 60),
          breakHours: round2(breakMinutesForEmployee / 60),
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

// GET /api/report/analytics/employee-idle/current?date=YYYY-MM-DD
// Returns employees who are currently checked IN (security) and NOT in an active work session.
// idleSince = lastWorkSessionEndTime (if any) else lastCheckInTime
export const getCurrentIdleEmployees = async (req, res) => {
  try {
    const { date } = req.query;
    const day = String(date || '').trim();
    if (!day) {
      return res.status(400).json({ message: 'date is required in format YYYY-MM-DD' });
    }

    const { start, end } = parseYyyyMmDdToLocalDayRange(day);
    const now = new Date();

    // Determine who is currently on site: latest attendance log for the date must be IN.
    const lastAttendanceRows = await AttendanceLog.aggregate([
      {
        $match: {
          workDate: day,
          scanLocation: 'SECURITY'
        }
      },
      { $sort: { scanTime: -1 } },
      {
        $group: {
          _id: '$employeeId',
          scanType: { $first: '$scanType' },
          scanTime: { $first: '$scanTime' },
          companyId: { $first: '$companyId' }
        }
      }
    ]);

    const onSiteRows = lastAttendanceRows.filter((r) => r?.scanType === 'IN' && r?._id);
    const onSiteEmployeeIds = onSiteRows.map((r) => r._id);

    if (onSiteEmployeeIds.length === 0) {
      return res.status(200).json({ date: day, now, rows: [] });
    }

    const lastCheckInMap = new Map(onSiteRows.map((r) => [String(r._id), r.scanTime]));
    const companyFromAttendanceMap = new Map(onSiteRows.map((r) => [String(r._id), r.companyId]));

    // Find employees currently in an active work session (endTime missing).
    const activeSessions = await WorkSession.find({
      employeeId: { $in: onSiteEmployeeIds },
      endTime: { $exists: false }
    })
      .select('employeeId')
      .lean();

    const inWorkSet = new Set(activeSessions.map((s) => String(s.employeeId)));
    const idleEmployeeIds = onSiteEmployeeIds.filter((id) => !inWorkSet.has(String(id)));

    if (idleEmployeeIds.length === 0) {
      return res.status(200).json({ date: day, now, rows: [] });
    }

    // For each idle employee, get their last completed work session endTime for the day.
    const lastEndedSessions = await WorkSession.aggregate([
      {
        $match: {
          employeeId: { $in: idleEmployeeIds },
          startTime: { $gte: start, $lte: end },
          endTime: { $ne: null }
        }
      },
      { $sort: { endTime: -1 } },
      {
        $group: {
          _id: '$employeeId',
          lastEndTime: { $first: '$endTime' },
          lastProcessName: { $first: '$processName' }
        }
      }
    ]);

    const lastEndMap = new Map(lastEndedSessions.map((r) => [String(r._id), r.lastEndTime]));
    const lastProcessMap = new Map(lastEndedSessions.map((r) => [String(r._id), r.lastProcessName]));

    const employees = await Employee.find({ _id: { $in: idleEmployeeIds } })
      .select('name employeeId employeeType companyId')
      .lean();
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

    const rows = idleEmployeeIds
      .map((employeeObjectId) => {
        const key = String(employeeObjectId);
        const employee = employeeMap.get(key) || {};
        const companyId = employee.companyId || companyFromAttendanceMap.get(key) || null;
        const companyName = companyId ? companyNameMap.get(String(companyId)) : null;

        const lastCheckInTime = lastCheckInMap.get(key) || null;
        const lastWorkSessionEndTime = lastEndMap.get(key) || null;

        // idleSince should start from the most recent of:
        // - last completed work session end
        // - last security check-in (e.g., employee checked out and back in later)
        let idleSince = null;
        if (lastWorkSessionEndTime && lastCheckInTime) {
          idleSince = new Date(lastWorkSessionEndTime) > new Date(lastCheckInTime)
            ? lastWorkSessionEndTime
            : lastCheckInTime;
        } else {
          idleSince = lastWorkSessionEndTime || lastCheckInTime;
        }
        if (!idleSince) return null;

        const idleMinutesRaw = (now.getTime() - new Date(idleSince).getTime()) / 60000;
        const idleMinutes = idleMinutesRaw < 0 ? 0 : idleMinutesRaw;

        return {
          employeeId: employeeObjectId,
          employeeCode: employee.employeeId || null,
          employeeName: employee.name || 'Unknown Employee',
          employeeType: employee.employeeType || null,
          companyId,
          companyName: companyName || 'Unknown Company',
          lastCheckInTime,
          lastWorkSessionEndTime,
          lastProcessName: lastProcessMap.get(key) || null,
          idleSince,
          idleMinutes: round2(idleMinutes),
          idleHours: round2(idleMinutes / 60)
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.idleMinutes || 0) - (a.idleMinutes || 0));

    return res.status(200).json({
      date: day,
      now,
      rows
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Failed to compute current idle employees'
    });
  }
};
