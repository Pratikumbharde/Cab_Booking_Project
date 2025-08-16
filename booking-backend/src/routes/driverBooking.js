import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { 
  getDriverBookings, 
  updateBookingStatus, 
  getDriverProfile 
} from '../controllers/driverBookingController.js';

const router = express.Router();

// All routes require driver authentication
router.use(authenticateToken);
router.use(authorizeRoles('driver'));

// Get driver's assigned bookings
router.get('/bookings', getDriverBookings);

// Update booking status
router.patch('/bookings/:id/status', updateBookingStatus);

// Get driver profile and stats
router.get('/profile', getDriverProfile);

export default router;
