import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  amount: Number,
  status: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  submittedAt: Date,
  paidAt: Date,
  reportMonth: String // e.g. '2025-08'
}, { timestamps: true });

export default mongoose.model('Invoice', InvoiceSchema);
