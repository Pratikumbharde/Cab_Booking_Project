import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  aadhar: String,
  pan: String,
  phone: String,
  address: String,
  bankInfo: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
    branch: String
  },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }
}, { timestamps: true });

export default mongoose.model('Driver', DriverSchema);
