import Driver from '../models/Driver.js';
import { emitToVendor } from '../utils/socket.js';

export const createDriver = async (req, res) => {
  try {
    const driver = new Driver({ ...req.body, vendor: req.user.vendor });
    await driver.save();
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getDrivers = async (req, res) => {
  try {
    console.log('User:', req.user);
    console.log('User vendor:', req.user.vendor);
    
    // For vendors, filter by their vendor ID
    let filter = {};
    if (req.user.role === 'vendor' && req.user.vendor) {
      filter.vendor = req.user.vendor;
    }
    
    const drivers = await Driver.find(filter).populate('vendor');
    console.log(`Found ${drivers.length} drivers for user ${req.user.email}`);
    res.json(drivers);
  } catch (err) {
    console.error('Error in getDrivers:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getDriver = async (req, res) => {
  try {
    const driver = await Driver.findOne({ _id: req.params.id, vendor: req.user.vendor });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findOneAndUpdate({ _id: req.params.id, vendor: req.user.vendor }, req.body, { new: true });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    emitToVendor(driver.vendor, 'driver:update', driver);
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findOneAndDelete({ _id: req.params.id, vendor: req.user.vendor });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
