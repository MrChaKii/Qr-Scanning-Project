import BreakSession from '../models/BreakSession.js';
import QRCode from '../models/QRCode.js';
import Employee from '../models/Employee.js';


// POST /api/break-session/create
// Toggle break: if open, end it; if not, start new
export const createBreak = async (req, res) => {
  try {
    const { breakType, startTime, endTime } = req.body;
    if (!breakType) {
      return res.status(400).json({ message: 'breakType is required' });
    }
    const breakSession = new BreakSession({
      breakType,
      startTime: startTime ? new Date(startTime) : new Date(),
      ...(endTime && { endTime: new Date(endTime) })
    });
    await breakSession.save();
    res.status(201).json({
      message: 'Break session created',
      breakSession
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// PUT /api/break-session/:id
export const updateBreak = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const breakSession = await BreakSession.findByIdAndUpdate(id, update, { new: true });
    if (!breakSession) {
      return res.status(404).json({ message: 'Break session not found.' });
    }
    res.status(200).json({
      message: 'Break session updated',
      breakSession
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
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
    res.status(200).json({
      message: 'Break session deleted',
      breakSession
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

// GET /api/break-session
export const getBreaks = async (req, res) => {
  try {
    const breaks = await BreakSession.find().sort({ startTime: -1 });
    res.status(200).json(breaks);
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};
