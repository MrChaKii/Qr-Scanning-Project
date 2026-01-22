import Process from "../models/Process.js";

// Create a new process
export const createProcess = async (req, res) => {
  try {
    const { processId, processName } = req.body;

    const existing = await Process.findOne({ processId });
    if (existing) {
      return res.status(400).json({ message: 'Process already exists' });
    }

    const process = new Process({
      processId,
      processName
    });

    await process.save();

    res.status(201).json({
      message: 'Process created successfully',
      process
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all processes
export const getAllProcesses = async (req, res) => {
  try {
    const processes = await Process.find().sort({ createdAt: -1 });
    res.json({ data: processes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });  
  }
};

// Get a single process by processId
export const getProcessById = async (req, res) => {
  try {
    const { processId } = req.params;
    const process = await Process.findOne({ processId });
    
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    
    res.json({ data: process });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a process
export const updateProcess = async (req, res) => {
  try {
    const { processId } = req.params;
    const { processName, processId: newProcessId } = req.body;

    // Build update object
    const updateFields = {};
    if (processName !== undefined) updateFields.processName = processName;
    if (newProcessId && newProcessId !== processId) {
      updateFields.processId = newProcessId;
    }

    const process = await Process.findOneAndUpdate(
      { processId },
      updateFields,
      { new: true }
    );

    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }

    res.json({ message: 'Process updated successfully', process });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a process
export const deleteProcess = async (req, res) => {
  try {
    const { processId } = req.params;
    const process = await Process.findOneAndDelete({ processId });
    
    if (!process) {
      return res.status(404).json({ message: 'Process not found' });
    }
    
    res.json({ message: 'Process deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get processes by company
export const getProcessesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const processes = await Process.find({ companyId }).sort({ createdAt: -1 });
    res.json({ data: processes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
