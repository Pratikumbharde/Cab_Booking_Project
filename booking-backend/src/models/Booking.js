import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle',
    required: true
  },
  bookingType: { 
    type: String, 
    enum: ['instant', 'scheduled'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: [
      'pending', 
      'confirmed', 
      'driver_assigned', 
      'arriving', 
      'in_ride', 
      'completed', 
      'cancelled',
      'rejected'
    ], 
    default: 'pending' 
  },
  pickup: {
    address: { type: String, required: true },
    coordinates: { 
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    time: { type: Date, required: true },
    notes: String
  },
  drop: {
    address: { type: String, required: true },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    estimatedTime: Number, // in minutes
    estimatedDistance: Number, // in km
    notes: String
  },
  fare: {
    base: { type: Number, required: true },
    distance: { type: Number, required: true },
    time: { type: Number, required: true },
    surge: { type: Number, default: 1.0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    isPaid: { type: Boolean, default: false }
  },
  payment: {
    method: { type: String, enum: ['cash', 'card', 'wallet', 'upi'] },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'], 
      default: 'pending' 
    },
    amount: { type: Number },
    transactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  driver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver' 
  },
  vehicle: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicle' 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor' 
  },
  rating: {
    driver: { type: Number, min: 1, max: 5 },
    vehicle: { type: Number, min: 1, max: 5 },
    feedback: String,
    submittedAt: Date
  },
  cancellationReason: {
    by: { type: String, enum: ['user', 'driver', 'system'] },
    reason: String,
    timestamp: Date
  },
  route: mongoose.Schema.Types.Mixed,
  routePolyline: String,
  actualDistance: Number,
  actualDuration: Number,
  startTime: Date,
  endTime: Date,
  waitingTime: Number,
  tolls: [{
    amount: Number,
    location: String,
    isPaid: { type: Boolean, default: false }
  }],
  notes: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
BookingSchema.index({ 'pickup.coordinates': '2dsphere' });
BookingSchema.index({ 'drop.coordinates': '2dsphere' });
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ driver: 1, status: 1 });
BookingSchema.index({ status: 1, createdAt: -1 });

// Virtual for ride duration
BookingSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return (this.endTime - this.startTime) / 60000; // in minutes
  }
  return null;
});

export default mongoose.model('Booking', BookingSchema);
