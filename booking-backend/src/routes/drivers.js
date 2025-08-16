import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  createDriver,
  getDrivers,
  getDriver,
  updateDriver,
  deleteDriver
} from '../controllers/driverController.js';

const router = express.Router();

// Create driver
router.post('/', authenticateToken, authorizeRoles('vendor', 'admin'), createDriver);

// Get all drivers for vendor
router.get('/', authenticateToken, authorizeRoles('vendor', 'admin'), getDrivers);

// Get single driver
router.get('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), getDriver);

// Update driver
router.put('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), updateDriver);

// Delete driver
router.delete('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), deleteDriver);

export default router;
