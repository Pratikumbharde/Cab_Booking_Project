import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { bookRide, getRideHistory } from '../controllers/rideController.js';

const router = express.Router();

// Book a ride (customer)
router.post('/book', authenticateToken, authorizeRoles('customer'), bookRide);

// Get ride history (customer)
router.get('/history', authenticateToken, authorizeRoles('customer'), getRideHistory);

export default router;
