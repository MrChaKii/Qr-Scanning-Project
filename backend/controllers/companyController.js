import Company from "../Models/Company.js";

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
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};