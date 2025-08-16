import Booking from '../models/Booking.js';
import { emitToUser, emitToVendor } from '../utils/socket.js';

// Get bookings assigned to the current driver
export const getDriverBookings = async (req, res) => {
  try {
    console.log('Fetching bookings for driver:', req.user.driver);
    
    const bookings = await Booking.find({ 
      driver: req.user.driver 
    })
    .populate('user', 'name phone email')
    .populate('vehicle', 'model plate type')
    .populate('vendor', 'email')
    .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for driver ${req.user.name}`);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching driver bookings:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update booking status (driver actions)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const allowedStatuses = ['driver_assigned', 'arriving', 'in_ride', 'completed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Allowed: ' + allowedStatuses.join(', ') 
      });
    }

    const booking = await Booking.findOne({ 
      _id: id, 
      driver: req.user.driver 
    }).populate('user vendor vehicle');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or not assigned to you' });
    }

    // Update booking status
    booking.status = status;
    
    // Set timestamps based on status
    if (status === 'in_ride') {
      booking.startTime = new Date();
    } else if (status === 'completed') {
      booking.endTime = new Date();
      if (booking.payment.method === 'cash') {
        booking.payment.status = 'completed';
      }
    }

    await booking.save();

    // Emit real-time updates
    emitToUser(booking.user._id.toString(), 'booking:status_update', {
      bookingId: booking._id,
      status: status,
      message: getStatusMessage(status)
    });

    if (booking.vendor) {
      emitToVendor(booking.vendor._id.toString(), 'booking:status_update', booking);
    }

    console.log(`Driver ${req.user.name} updated booking ${booking.bookingId} to ${status}`);
    
    res.json({
      success: true,
      booking,
      message: `Booking status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get driver profile/stats
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = req.user.driver;
    
    // Get booking statistics
    const [totalBookings, completedBookings, todayBookings] = await Promise.all([
      Booking.countDocuments({ driver: driverId }),
      Booking.countDocuments({ driver: driverId, status: 'completed' }),
      Booking.countDocuments({ 
        driver: driverId, 
        createdAt: { 
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      })
    ]);

    // Calculate earnings (simplified)
    const completedBookingsWithPayment = await Booking.find({ 
      driver: driverId, 
      status: 'completed',
      'payment.status': 'completed'
    }).select('payment.amount');

    const totalEarnings = completedBookingsWithPayment.reduce((sum, booking) => 
      sum + (booking.payment?.amount || 0), 0
    );

    res.json({
      driver: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      },
      stats: {
        totalBookings,
        completedBookings,
        todayBookings,
        totalEarnings,
        completionRate: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get status messages
function getStatusMessage(status) {
  const messages = {
    'driver_assigned': 'Driver has been assigned to your booking',
    'arriving': 'Driver is on the way to pickup location',
    'in_ride': 'Your ride has started',
    'completed': 'Your ride has been completed'
  };
  return messages[status] || 'Booking status updated';
}
