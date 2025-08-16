import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles
} from '../controllers/vehicleController.js';

const router = express.Router();

// Create vehicle
router.post('/', authenticateToken, authorizeRoles('vendor', 'admin'), createVehicle);

// Get available vehicles (public endpoint) - MUST be before /:id route
router.get('/available', getAvailableVehicles);

// Get all vehicles for vendor
router.get('/', authenticateToken, authorizeRoles('vendor', 'admin'), getVehicles);

// Get single vehicle
router.get('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), getVehicle);

// Update vehicle
router.put('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), updateVehicle);

// Delete vehicle
router.delete('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), deleteVehicle);

export default router;
