import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import Vehicle from './src/models/Vehicle.js';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';
import { config } from 'dotenv';

config({ path: './src/.env' });

async function testBookingFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('=== TESTING BOOKING FLOW ===');

    // 1. Check vendor user and vendor association
    const vendorUser = await User.findOne({ email: 'vendor@gmail.com' }).populate('vendor');
    console.log('1. Vendor User:', vendorUser?.name);
    console.log('   Vendor ID:', vendorUser?.vendor?._id);
    console.log('   Vendor Name:', vendorUser?.vendor?.name);

    // 2. Check vehicles and their vendor association
    const vehicles = await Vehicle.find({}).populate('vendor', 'name email').populate('driver', 'name');
    console.log('\n2. Vehicles:');
    vehicles.forEach((v, i) => {
      console.log(`   ${i+1}. ${v.type} - ${v.model} (${v.plate})`);
      console.log(`      Vendor: ${v.vendor?.name || 'NO VENDOR'} (${v.vendor?._id || 'NO ID'})`);
      console.log(`      Driver: ${v.driver?.name || 'NO DRIVER'}`);
      console.log(`      Available: ${v.available}`);
    });

    // 3. Check existing bookings
    const existingBookings = await Booking.find({}).populate('vendor', 'name').populate('vehicle', 'model type').sort({ createdAt: -1 });
    console.log(`\n3. Existing Bookings (${existingBookings.length}):`);
    existingBookings.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.bookingId} - ${b.status}`);
      console.log(`      Vendor: ${b.vendor?.name || 'NO VENDOR'} (${b.vendor?._id || 'NO ID'})`);
      console.log(`      Vehicle: ${b.vehicle?.type} ${b.vehicle?.model || 'NO VEHICLE'}`);
      console.log(`      Created: ${b.createdAt}`);
    });

    // 4. Test vendor booking query (same as dashboard)
    if (vendorUser?.vendor?._id) {
      const vendorBookings = await Booking.find({ vendor: vendorUser.vendor._id })
        .populate('vehicle driver vendor user')
        .sort({ createdAt: -1 });
      console.log(`\n4. Vendor Dashboard Query Results (${vendorBookings.length} bookings):`);
      vendorBookings.forEach((b, i) => {
        console.log(`   ${i+1}. ${b.bookingId} - ${b.status}`);
        console.log(`      User: ${b.user?.name || 'NO USER'}`);
        console.log(`      Vehicle: ${b.vehicle?.type} ${b.vehicle?.model || 'NO VEHICLE'}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBookingFlow();
