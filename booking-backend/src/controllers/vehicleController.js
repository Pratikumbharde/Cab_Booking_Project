import Vehicle from '../models/Vehicle.js';
import { emitToVendor } from '../utils/socket.js';

export const createVehicle = async (req, res) => {
  try {
    const vehicle = new Vehicle({ ...req.body, vendor: req.user.vendor });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVehicles = async (req, res) => {
  try {
    console.log('User:', req.user);
    console.log('User vendor:', req.user.vendor);
    
    // For vendors, filter by their vendor ID
    let filter = {};
    if (req.user.role === 'vendor' && req.user.vendor) {
      filter.vendor = req.user.vendor;
    }
    
    const vehicles = await Vehicle.find(filter).populate('vendor driver');
    console.log(`Found ${vehicles.length} vehicles for user ${req.user.email}`);
    res.json(vehicles);
  } catch (err) {
    console.error('Error in getVehicles:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, vendor: req.user.vendor });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate({ _id: req.params.id, vendor: req.user.vendor }, req.body, { new: true });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    emitToVendor(vehicle.vendor, 'vehicle:update', vehicle);
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, vendor: req.user.vendor });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAvailableVehicles = async (req, res) => {
  try {
    console.log('Fetching available vehicles...');
    
    // Try to get all available vehicles first (simplified approach)
    let vehicles = await Vehicle.find({ 
      available: { $ne: false } // Get vehicles that are not explicitly set to false
    }).populate('vendor', 'name email phone').lean();
    
    // If no vehicles found with availability filter, get all vehicles for development
    if (vehicles.length === 0) {
      console.log('No available vehicles found, fetching all vehicles...');
      vehicles = await Vehicle.find({}).populate('vendor', 'name email phone').lean();
    }
    
    console.log(`Found ${vehicles.length} vehicles`);
    res.json(vehicles);
  } catch (err) {
    console.error('Error in getAvailableVehicles:', err);
    
    // Fallback: try to get any vehicles without filters
    try {
      console.log('Attempting fallback query...');
      const fallbackVehicles = await Vehicle.find({}).lean();
      console.log(`Fallback found ${fallbackVehicles.length} vehicles`);
      res.json(fallbackVehicles);
    } catch (fallbackErr) {
      console.error('Fallback query also failed:', fallbackErr);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching available vehicles',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};
