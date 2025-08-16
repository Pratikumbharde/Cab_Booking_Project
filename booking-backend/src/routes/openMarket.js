import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  pushToOpenMarket,
  getOpenMarketBookings
} from '../controllers/openMarketController.js';

const router = express.Router();

// Push booking to open market
router.post('/:id/push', authenticateToken, authorizeRoles('vendor', 'admin'), pushToOpenMarket);

// Get open market bookings (for vendors)
router.get('/', authenticateToken, authorizeRoles('vendor', 'admin'), getOpenMarketBookings);

export default router;
