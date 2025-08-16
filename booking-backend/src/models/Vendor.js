import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  address: String,
  role: { type: String, enum: ['vendor', 'admin'], default: 'vendor' },
  whitelisted: { type: Boolean, default: false },
  bankInfo: {
    accountNumber: String,
    ifsc: String,
    bankName: String,
    branch: String
  }
}, { timestamps: true });

export default mongoose.model('Vendor', VendorSchema);
