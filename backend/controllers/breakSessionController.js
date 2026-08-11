import BreakSession from '../models/BreakSession.js';

const HH_MM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Convert an "HH:MM" string to total minutes since midnight.
 */
const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

/**
 * Validate that a value is a valid "HH:MM" string.
 * Returns the value trimmed, or null if invalid.
 */
const parseHHMM = (value) => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return HH_MM_RE.test(v) ? v : null;
};

// POST /api/break-session/create
export const createBreak = async (req, res) => {
  try {
    const { breakType, startTime, endTime } = req.body;

    if (!breakType) {
      return res.status(400).json({ message: 'breakType is required' });
    }

    const parsedStart = parseHHMM(startTime);
    const parsedEnd   = parseHHMM(endTime);

    if (!parsedStart) {
      return res.status(400).json({ message: 'startTime is required and must be in HH:MM format (24-hour)' });
    }
    if (!parsedEnd) {
      return res.status(400).json({ message: 'endTime is required and must be in HH:MM format (24-hour)' });
    }
    if (toMinutes(parsedEnd) <= toMinutes(parsedStart)) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    const breakSession = new BreakSession({ breakType, startTime: parsedStart, endTime: parsedEnd });
    await breakSession.save();

    res.status(201).json({ message: 'Break session created', breakSession });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/break-session/:id
export const updateBreak = async (req, res) => {
  try {
    const { id } = req.params;
    const { breakType, startTime, endTime } = req.body;

    const breakSession = await BreakSession.findById(id);
    if (!breakSession) {
      return res.status(404).json({ message: 'Break session not found.' });
    }

    if (breakType !== undefined) breakSession.breakType = breakType;

    if (startTime !== undefined) {
      const parsedStart = parseHHMM(startTime);
      if (!parsedStart) {
        return res.status(400).json({ message: 'startTime must be in HH:MM format (24-hour)' });
      }
      breakSession.startTime = parsedStart;
    }

    if (endTime !== undefined) {
      const parsedEnd = parseHHMM(endTime);
      if (!parsedEnd) {
        return res.status(400).json({ message: 'endTime must be in HH:MM format (24-hour)' });
      }
      breakSession.endTime = parsedEnd;
    }

    if (toMinutes(breakSession.endTime) <= toMinutes(breakSession.startTime)) {
      return res.status(400).json({ message: 'endTime must be after startTime' });
    }

    await breakSession.save(); // pre-save hook recomputes durationMinutes

    res.status(200).json({ message: 'Break session updated', breakSession });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/break-session/:id
export const deleteBreak = async (req, res) => {
  try {
    const { id } = req.params;
    const breakSession = await BreakSession.findByIdAndDelete(id);
    if (!breakSession) {
      return res.status(404).json({ message: 'Break session not found.' });
    }
    res.status(200).json({ message: 'Break session deleted', breakSession });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/break-session
export const getBreaks = async (req, res) => {
  try {
    // Sort lexicographically by startTime — works perfectly for "HH:MM" strings
    const breaks = await BreakSession.find().sort({ startTime: 1 });
    res.status(200).json(breaks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * POST /api/break-session/migrate-to-time-range
 *
 * Converts legacy break sessions that were stored with either:
 *   - Full ISO-string startTime/endTime  (e.g. "2026-08-01T07:00:00.000Z")
 *   - durationMinutes only (no usable startTime)
 *
 * Migration strategy:
 *   - If startTime is an ISO datetime string, extract the "HH:MM" wall-clock
 *     part (server local time) and compute endTime from the ISO endTime or
 *     by adding durationMinutes.
 *   - Records that already have valid HH:MM times are skipped.
 *   - Records with durationMinutes only and no parseable startTime are
 *     listed as "needs manual fix".
 *
 * Returns { migrated, skipped, needsManualFix, errors }
 */
export const migrateBreaks = async (req, res) => {
  try {
    const allBreaks = await BreakSession.find();

    const results = { migrated: 0, skipped: 0, needsManualFix: [], errors: [] };

    for (const brk of allBreaks) {
      // Already in valid HH:MM format — skip
      if (HH_MM_RE.test(brk.startTime) && HH_MM_RE.test(brk.endTime)) {
        results.skipped += 1;
        continue;
      }

      let newStart = null;
      let newEnd   = null;

      // Try to parse a full ISO startTime
      if (brk.startTime && !HH_MM_RE.test(brk.startTime)) {
        const isoStart = new Date(brk.startTime);
        if (!Number.isNaN(isoStart.getTime())) {
          // Extract local HH:MM from the ISO date
          const h = String(isoStart.getHours()).padStart(2, '0');
          const m = String(isoStart.getMinutes()).padStart(2, '0');
          newStart = `${h}:${m}`;

          // Try endTime ISO first
          if (brk.endTime && !HH_MM_RE.test(brk.endTime)) {
            const isoEnd = new Date(brk.endTime);
            if (!Number.isNaN(isoEnd.getTime())) {
              const eh = String(isoEnd.getHours()).padStart(2, '0');
              const em = String(isoEnd.getMinutes()).padStart(2, '0');
              newEnd = `${eh}:${em}`;
            }
          }

          // Fall back to durationMinutes
          if (!newEnd && brk.durationMinutes > 0) {
            const totalMins = isoStart.getHours() * 60 + isoStart.getMinutes() + brk.durationMinutes;
            const eh = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
            const em = String(totalMins % 60).padStart(2, '0');
            newEnd = `${eh}:${em}`;
          }
        }
      }

      if (!newStart || !newEnd || toMinutes(newEnd) <= toMinutes(newStart)) {
        results.needsManualFix.push({
          _id: brk._id,
          breakType: brk.breakType,
          reason: !newStart
            ? 'Could not parse startTime'
            : !newEnd
            ? 'Could not determine endTime (no ISO endTime or durationMinutes)'
            : 'Computed endTime is not after startTime',
        });
        continue;
      }

      try {
        brk.startTime = newStart;
        brk.endTime   = newEnd;
        await brk.save(); // pre-save hook recomputes durationMinutes
        results.migrated += 1;
      } catch (saveErr) {
        results.errors.push({ _id: brk._id, breakType: brk.breakType, error: saveErr.message });
      }
    }

    return res.status(200).json({
      message: 'Migration complete',
      ...results,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
