import mongoose from 'mongoose';

const CustomViewSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  resource: { type: String, enum: ['Booking', 'Driver', 'Vehicle', 'Invoice'], required: true },
  filters: { type: Object, default: {} },
  columns: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CustomView', CustomViewSchema);
