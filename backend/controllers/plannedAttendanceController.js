import PlannedAttendance from '../models/PlannedAttendance.js';
import AttendanceLog from '../models/AttendanceLog.js';
import Company from '../models/Company.js';

export const setPlannedAttendance = async (req, res) => {
  try {
    const { companyId, date, plannedCount } = req.body;

    if (!companyId || !date || plannedCount === undefined) {
      return res.status(400).json({ message: 'companyId, date, and plannedCount are required.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const planned = await PlannedAttendance.findOneAndUpdate(
      { companyId, date: startOfDay },
      { plannedCount, updatedAt: Date.now() },
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
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const plannedAttendance = await PlannedAttendance.find({ date: queryDate }).populate('companyId', 'companyName companyId');
    
    // Calculate actual attendance - count only currently checked-in employees (latest scan is IN)
    const actualAttendance = await AttendanceLog.aggregate([
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
          companyId: { $first: '$companyId' }
        }
      },
      {
        $match: {
          latestScanType: 'IN'
        }
      },
      {
        $group: {
          _id: '$companyId',
          actualCount: { $sum: 1 }
        }
      }
    ]);

    const companies = await Company.find({
      employeeTypeAllowed: { $in: ['manpower', 'permanent', 'casual'] }
    });

    const result = companies.map(company => {
      const planned = plannedAttendance.find(p => p.companyId && p.companyId._id.toString() === company._id.toString());
      const actual = actualAttendance.find(a => a._id && a._id.toString() === company._id.toString());

      return {
        companyId: company._id,
        companyName: company.companyName,
        plannedCount: planned ? planned.plannedCount : 0,
        actualCount: actual ? actual.actualCount : 0
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in getPlannedVsActualAttendance:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
