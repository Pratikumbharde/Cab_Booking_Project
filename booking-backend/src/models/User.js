import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['customer', 'vendor', 'admin', 'driver'], default: 'customer' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }],
  paymentMethods: [{
    type: { type: String, enum: ['card', 'wallet', 'netbanking'] },
    details: mongoose.Schema.Types.Mixed,
    isDefault: Boolean
  }],
  profilePicture: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  deviceToken: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster querying
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model('User', UserSchema);
