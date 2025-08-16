import Booking from '../models/Booking.js';
import Vendor from '../models/Vendor.js';

// Push booking to open market (initially whitelisted, then open to all)
export const pushToOpenMarket = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'Ongoing') return res.status(400).json({ message: 'Only ongoing bookings can be pushed' });
    const now = new Date();
    booking.status = 'OpenMarket';
    booking.openMarket = {
      pushed: true,
      pushedAt: now,
      whitelistedOnlyUntil: new Date(now.getTime() + 30 * 60 * 1000) // 30 min from now
    };
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get open market bookings (filter by whitelisted/all)
export const getOpenMarketBookings = async (req, res) => {
  try {
    const now = new Date();
    let filter = { status: 'OpenMarket', 'openMarket.pushed': true };
    if (req.user.role === 'vendor') {
      // Only show to whitelisted vendors if within 30 min
      filter = {
        ...filter,
        $or: [
          { 'openMarket.whitelistedOnlyUntil': { $lt: now } },
          { 'openMarket.whitelistedOnlyUntil': { $gte: now }, vendor: req.user.vendor }
        ]
      };
      // If vendor is not whitelisted, only show after 30 min
      const vendor = await Vendor.findById(req.user.vendor);
      if (!vendor?.whitelisted) {
        filter['openMarket.whitelistedOnlyUntil'] = { $lt: now };
      }
    }
    const bookings = await Booking.find(filter).populate('vehicle driver vendor');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
