import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  createCustomView,
  getCustomViews,
  getCustomView,
  updateCustomView,
  deleteCustomView
} from '../controllers/customViewController.js';

const router = express.Router();

// Create custom view
router.post('/', authenticateToken, authorizeRoles('vendor', 'admin'), createCustomView);

// Get all custom views for vendor
router.get('/', authenticateToken, authorizeRoles('vendor', 'admin'), getCustomViews);

// Get single custom view
router.get('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), getCustomView);

// Update custom view
router.put('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), updateCustomView);

// Delete custom view
router.delete('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), deleteCustomView);

export default router;
