import PlannedAttendance from '../models/PlannedAttendance.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Company from '../models/Company.js';

const SRI_LANKA_TIME_ZONE = 'Asia/Colombo';
const DAY_SHIFT_START_MINUTES = 7 * 60;
const DAY_SHIFT_END_MINUTES = 12 * 60 + 45;

const getSriLankaDateTimeParts = (value) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SRI_LANKA_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));

  return Object.fromEntries(parts
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, Number(part.value)]));
};

const getPlannedAttendanceShiftBounds = (date) => {
  const [year, month, day] = String(date).split('-').map(Number);
  const sriLankaOffsetMinutes = 5 * 60 + 30;
  const start = new Date(
    Date.UTC(year, month - 1, day, 7) - sriLankaOffsetMinutes * 60 * 1000
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

const getPlannedAttendanceShift = (scanTime) => {
  const { hour, minute } = getSriLankaDateTimeParts(scanTime);
  const minutesAfterMidnight = hour * 60 + minute;

  return minutesAfterMidnight >= DAY_SHIFT_START_MINUTES
    && minutesAfterMidnight <= DAY_SHIFT_END_MINUTES
    ? 'Day'
    : 'Night';
};

export const setPlannedAttendance = async (req, res) => {
  try {
    const { companyId, date, plannedCount, shift } = req.body;

    if (!companyId || !date || plannedCount === undefined || !['Day', 'Night'].includes(shift)) {
      return res.status(400).json({ message: 'companyId, date, plannedCount, and a valid shift (Day or Night) are required.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const planned = await PlannedAttendance.findOneAndUpdate(
      { companyId, date: startOfDay, shift },
      { plannedCount, shift, updatedAt: Date.now() },
      { new: true, upsert: true }
    );

    res.status(200).json(planned);
  } catch (error) {
    console.error('Error in setPlannedAttendance:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getPlannedAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const planned = await PlannedAttendance.find({ date: startOfDay }).populate('companyId', 'companyName companyId');
    res.status(200).json(planned);
  } catch (error) {
    console.error('Error in getPlannedAttendanceByDate:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

export const getPlannedVsActualAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const { start: shiftPeriodStart, end: shiftPeriodEnd } = getPlannedAttendanceShiftBounds(date);
    const plannedAttendance = await PlannedAttendance.find({ date: queryDate }).populate('companyId', 'companyName companyId');

    // Count each employee once for the shift where they checked in. A later
    // checkout must not reduce the Actual Attended total for that shift.
    const shiftCheckIns = await AttendanceLog.find({
      scanLocation: 'SECURITY',
      scanType: 'IN',
      scanTime: { $gte: shiftPeriodStart, $lt: shiftPeriodEnd },
    }).select('employeeId companyId scanTime');

    const countedEmployees = new Set();
    const actualAttendance = shiftCheckIns.reduce((counts, checkIn) => {
      const shift = getPlannedAttendanceShift(checkIn.scanTime);
      const companyId = String(checkIn.companyId);
      const employeeId = String(checkIn.employeeId);
      const attendanceKey = `${companyId}:${shift}:${employeeId}`;

      if (countedEmployees.has(attendanceKey)) {
        return counts;
      }

      countedEmployees.add(attendanceKey);
      const companyShiftKey = `${companyId}:${shift}`;
      counts[companyShiftKey] = (counts[companyShiftKey] || 0) + 1;
      return counts;
    }, {});

    const companies = await Company.find({
      employeeTypeAllowed: { $in: ['manpower', 'permanent', 'casual'] }
    });

    const plannedMap = new Map(
      plannedAttendance.map((planned) => [
        `${planned.companyId?._id}:${planned.shift}`,
        planned.plannedCount
      ])
    );
    const result = companies.flatMap((company) => ['Day', 'Night'].map((shift) => {
      const key = `${company._id}:${shift}`;
      return {
        companyId: company._id,
        companyName: company.companyName,
        shift,
        plannedCount: plannedMap.get(key) || 0,
        actualCount: actualAttendance[key] || 0
      };
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPlannedVsActualAttendance:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
