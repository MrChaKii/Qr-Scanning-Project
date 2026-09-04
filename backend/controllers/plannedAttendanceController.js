import PlannedAttendance from '../models/PlannedAttendance.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Company from '../models/Company.js';

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
    const plannedAttendance = await PlannedAttendance.find({ date: queryDate }).populate('companyId', 'companyName companyId');
    
    // Calculate actual attendance - count only currently checked-in employees (latest scan is IN)
    const latestAttendance = await AttendanceLog.aggregate([
      {
        $match: {
          workDate: date,
          scanLocation: 'SECURITY'
        }
      },
      {
        $sort: { scanTime: -1 }
      },
      {
        $group: {
          _id: '$employeeId',
          latestScanType: { $first: '$scanType' },
          companyId: { $first: '$companyId' },
          scanTime: { $first: '$scanTime' }
        }
      },
      {
        $match: {
          latestScanType: 'IN'
        }
      },
    ]);

    // Assign an employee to the shift based on the local time of their security check-in.
    const actualAttendance = latestAttendance
      .filter((row) => row.latestScanType === 'IN')
      .reduce((counts, row) => {
        const hour = new Date(row.scanTime).getHours();
        const shift = hour >= 7 && hour < 19 ? 'Day' : 'Night';
        const key = `${row.companyId}:${shift}`;
        counts[key] = (counts[key] || 0) + 1;
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
