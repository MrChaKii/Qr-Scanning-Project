import TemporaryChangeover from '../models/TemporaryChangeover.js';

const isValidYyyyMmDd = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

// GET /api/changeovers?date=YYYY-MM-DD
export const getChangeovers = async (req, res) => {
  try {
    const day = String(req.query?.date || '').trim();
    if (!isValidYyyyMmDd(day)) {
      return res.status(400).json({ message: 'date is required in format YYYY-MM-DD' });
    }

    const rows = await TemporaryChangeover.find({ workDate: day })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ date: day, rows });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/changeovers
// Body: { date: 'YYYY-MM-DD', durationMinutes: number, note?: string }
export const createChangeover = async (req, res) => {
  try {
    const day = String(req.body?.date || '').trim();
    if (!isValidYyyyMmDd(day)) {
      return res.status(400).json({ message: 'date is required in format YYYY-MM-DD' });
    }

    const durationRaw = req.body?.durationMinutes;
    const durationMinutes = Number(durationRaw);
    if (Number.isNaN(durationMinutes) || durationMinutes < 0) {
      return res.status(400).json({ message: 'durationMinutes must be a non-negative number' });
    }

    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : undefined;

    const doc = new TemporaryChangeover({
      workDate: day,
      durationMinutes,
      ...(note ? { note } : {})
    });

    await doc.save();

    return res.status(201).json({ message: 'Changeover created', changeover: doc });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/changeovers/:id
export const deleteChangeover = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid changeover id' });
    }

    const deleted = await TemporaryChangeover.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Changeover not found' });
    }

    return res.status(200).json({ message: 'Changeover deleted', changeover: deleted });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
