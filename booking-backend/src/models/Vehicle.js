import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['sedan', 'suv', 'hatchback', 'luxury', 'minivan', 'truck']
  },
  plate: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  model: { 
    type: String, 
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  color: {
    type: String,
    required: true
  },
  seatingCapacity: {
    type: Number,
    required: true,
    min: 2,
    max: 20
  },
  pricePerKm: {
    type: Number,
    required: true,
    min: 0
  },
  insurance: {
    type: String,
    required: true,
    enum: ['VALID', 'EXPIRED', 'PENDING'],
    default: 'PENDING'
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  available: { 
    type: Boolean, 
    default: true 
  },
  vendor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vendor',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a 2dsphere index for geospatial queries
VehicleSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model('Vehicle', VehicleSchema);
