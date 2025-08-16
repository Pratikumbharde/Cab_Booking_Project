import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { emitToVendor, emitToAllVendors } from '../utils/socket.js';

export const createBooking = async (req, res) => {
  try {
    // Auto-assign vendor if vehicle is provided
    let bookingData = { ...req.body };
    
    if (bookingData.vehicle) {
      const vehicle = await Vehicle.findById(bookingData.vehicle).populate('vendor');
      if (vehicle && vehicle.vendor) {
        bookingData.vendor = vehicle.vendor._id;
      }
    }
    
    const booking = new Booking(bookingData);
    await booking.save();
    
    // Populate the booking for response
    await booking.populate('vehicle driver vendor user');
    
    console.log('New booking created:', booking.bookingId, 'for vendor:', booking.vendor);
    
    // Emit to vendor and all vendors (for open market)
    if (booking.vendor) {
      emitToVendor(booking.vendor, 'booking:new', booking);
    }
    if (booking.status === 'OpenMarket') {
      emitToAllVendors('booking:openMarket', booking);
    }
    
    res.status(201).json(booking);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    console.log('User:', req.user);
    console.log('User vendor:', req.user.vendor);
    
    const { status, vendorId } = req.query;
    const filter = {};
    
    // For vendors, filter by their vendor ID
    if (req.user.role === 'vendor' && req.user.vendor) {
      filter.vendor = req.user.vendor;
    }
    
    if (status) filter.status = status;
    if (vendorId && req.user.role === 'admin') filter.vendor = vendorId;
    
    const bookings = await Booking.find(filter)
      .populate('vehicle driver vendor');
    console.log(`Found ${bookings.length} bookings for user ${req.user.email}`);
    res.json(bookings);
  } catch (err) {
    console.error('Error in getBookings:', err);
    res.status(500).json({ message: err.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicle driver vendor');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // Emit update event
    emitToVendor(booking.vendor, 'booking:update', booking);
    if (booking.status === 'OpenMarket') emitToAllVendors('booking:openMarket', booking);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // Emit delete event
    emitToVendor(booking.vendor, 'booking:delete', { id: req.params.id });
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 }) // Most recent first
      .populate('vehicle', 'model type plate')
      .populate('vendor', 'businessName')
      .select('-__v');
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
