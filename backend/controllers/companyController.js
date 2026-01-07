import Company from "../models/Company.js";

// Create a new company
export const createCompany = async (req, res) => {
  try {
    const { companyId, companyName, employeeTypeAllowed } = req.body;

    const existing = await Company.findOne({ companyId });
    if (existing) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = new Company({
      companyId,
      companyName,
      employeeTypeAllowed
      // qrPrefix: name.toUpperCase()
    });

    await company.save();

    res.status(201).json({
      message: 'Company created',
      company
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// List all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json({ data: companies });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });  
  }
};

// Update a company
export const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { companyName, employeeTypeAllowed, companyId: newCompanyId } = req.body;

    // Build update object
    const updateFields = { companyName, employeeTypeAllowed };
    if (newCompanyId && newCompanyId !== companyId) {
      updateFields.companyId = newCompanyId;
    }

    const company = await Company.findOneAndUpdate(
      { companyId },
      updateFields,
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company updated', company });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a company
export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findOneAndDelete({ companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};