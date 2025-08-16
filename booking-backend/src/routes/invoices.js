import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice
} from '../controllers/invoiceController.js';

const router = express.Router();

// Create invoice
router.post('/', authenticateToken, authorizeRoles('vendor', 'admin'), createInvoice);

// Get all invoices for vendor
router.get('/', authenticateToken, authorizeRoles('vendor', 'admin'), getInvoices);

// Get single invoice
router.get('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), getInvoice);

// Update invoice
router.put('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), updateInvoice);

// Delete invoice
router.delete('/:id', authenticateToken, authorizeRoles('vendor', 'admin'), deleteInvoice);

export default router;
