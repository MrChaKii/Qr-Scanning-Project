import WorkSession from '../models/WorkSession.js';
import Company from '../models/Company.js';
import QRCodeModel from '../models/QRCode.js';

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

const parseYyyyMmToLocalMonthRange = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') {
    throw new Error('month is required in format YYYY-MM');
  }

  const parts = monthStr.split('-').map((n) => Number(n));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
    throw new Error('Invalid month format. Use YYYY-MM.');
  }

  const [year, month] = parts;
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
};

const buildManpowerWorkSessionPipeline = ({ start, end, now }) => {
  return [
    {
      $match: {
        startTime: { $gte: start, $lte: end }
      }
    },
    {
      $lookup: {
        from: QRCodeModel.collection.name,
        localField: 'qrId',
        foreignField: '_id',
        as: 'qr'
      }
    },
    { $unwind: { path: '$qr', preserveNullAndEmptyArrays: false } },
    {
      $match: {
        'qr.qrType': 'manpower'
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
        _id: '$companyId',
        totalMinutes: { $sum: '$durationMinutesEffective' },
        sessionCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: Company.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'company'
      }
    },
    { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        companyId: '$_id',
        companyName: { $ifNull: ['$company.companyName', 'Unknown Company'] },
        sessionCount: 1,
        totalMinutes: 1,
        totalHours: { $round: [{ $divide: ['$totalMinutes', 60] }, 2] }
      }
    },
    { $sort: { companyName: 1 } }
  ];
};

// GET /api/report/analytics/manpower-hours/daily?date=YYYY-MM-DD
export const getDailyManpowerWorkHoursByCompany = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = parseYyyyMmDdToLocalDayRange(String(date));

    const pipeline = buildManpowerWorkSessionPipeline({
      start,
      end,
      now: new Date()
    });

    const rows = await WorkSession.aggregate(pipeline);

    return res.status(200).json({
      date: String(date),
      rows
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Failed to compute daily manpower work hours'
    });
  }
};

// GET /api/report/analytics/manpower-hours/daily-average?date=YYYY-MM-DD
// Average is computed per session (since manpower sessions are not per individual).
export const getDailyAverageManpowerWorkHoursByCompany = async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = parseYyyyMmDdToLocalDayRange(String(date));

    const basePipeline = buildManpowerWorkSessionPipeline({
      start,
      end,
      now: new Date()
    });

    const pipeline = [
      ...basePipeline.slice(0, -2), // remove sort
      {
        $addFields: {
          averageHoursPerSession: {
            $cond: [
              { $gt: ['$sessionCount', 0] },
              { $round: [{ $divide: ['$totalHours', '$sessionCount'] }, 2] },
              0
            ]
          }
        }
      },
      {
        $project: {
          companyId: 1,
          companyName: 1,
          sessionCount: 1,
          totalHours: 1,
          averageHoursPerSession: 1
        }
      },
      { $sort: { companyName: 1 } }
    ];

    const rows = await WorkSession.aggregate(pipeline);

    return res.status(200).json({
      date: String(date),
      rows
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Failed to compute daily average manpower work hours'
    });
  }
};

// GET /api/report/analytics/manpower-hours/monthly?month=YYYY-MM
export const getMonthlyManpowerWorkHoursByCompany = async (req, res) => {
  try {
    const { month } = req.query;
    const { start, end } = parseYyyyMmToLocalMonthRange(String(month));

    const pipeline = buildManpowerWorkSessionPipeline({
      start,
      end,
      now: new Date()
    });

    const rows = await WorkSession.aggregate(pipeline);

    return res.status(200).json({
      month: String(month),
      rows
    });
  } catch (err) {
    return res.status(400).json({
      message: err.message || 'Failed to compute monthly manpower work hours'
    });
  }
};
