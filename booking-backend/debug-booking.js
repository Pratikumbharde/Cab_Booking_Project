import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import Vehicle from './src/models/Vehicle.js';
import User from './src/models/User.js';
import Driver from './src/models/Driver.js';
import Vendor from './src/models/Vendor.js';
import { config } from 'dotenv';

config({ path: './src/.env' });

async function debugBookingFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('=== BOOKING FLOW DEBUG ===\n');

    // 1. Check if Rahul's user account is properly linked to driver
    const rahulUser = await User.findOne({ email: 'RahulSharma@gmail.com' }).populate('driver');
    console.log('1. Rahul User Account:');
    console.log('   Name:', rahulUser?.name);
    console.log('   Role:', rahulUser?.role);
    console.log('   Driver ID:', rahulUser?.driver?._id);
    console.log('   Driver Name:', rahulUser?.driver?.name);

    // 2. Check vendor user and vendor association
    const vendorUser = await User.findOne({ email: 'vendor@gmail.com' }).populate('vendor');
    console.log('\n2. Vendor User Account:');
    console.log('   Name:', vendorUser?.name);
    console.log('   Role:', vendorUser?.role);
    console.log('   Vendor ID:', vendorUser?.vendor?._id);
    console.log('   Vendor Name:', vendorUser?.vendor?.name);

    // 3. Check vehicles and their associations
    const vehicles = await Vehicle.find({}).populate('vendor driver');
    console.log('\n3. Vehicles in Database:');
    vehicles.forEach((v, i) => {
      console.log(`   ${i+1}. ${v.type.toUpperCase()} - ${v.model} (${v.plate})`);
      console.log(`      Vendor: ${v.vendor?.name || 'NO VENDOR'}`);
      console.log(`      Driver: ${v.driver?.name || 'NO DRIVER'}`);
      console.log(`      Available: ${v.available}`);
    });

    // 4. Check existing bookings
    const bookings = await Booking.find({}).populate('user vendor driver vehicle').sort({ createdAt: -1 });
    console.log(`\n4. Existing Bookings (${bookings.length}):`);
    bookings.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.bookingId} - Status: ${b.status}`);
      console.log(`      User: ${b.user?.name || 'NO USER'}`);
      console.log(`      Vendor: ${b.vendor?.name || 'NO VENDOR'}`);
      console.log(`      Driver: ${b.driver?.name || 'NO DRIVER'}`);
      console.log(`      Vehicle: ${b.vehicle?.type} ${b.vehicle?.model || 'NO VEHICLE'}`);
      console.log(`      Created: ${b.createdAt}`);
    });

    // 5. Test vendor dashboard query
    if (vendorUser?.vendor?._id) {
      const vendorBookings = await Booking.find({ vendor: vendorUser.vendor._id })
        .populate('user vehicle driver')
        .sort({ createdAt: -1 });
      console.log(`\n5. Vendor Dashboard Query (${vendorBookings.length} bookings):`);
      vendorBookings.forEach((b, i) => {
        console.log(`   ${i+1}. ${b.bookingId} - ${b.status}`);
      });
    }

    // 6. Test driver dashboard query
    if (rahulUser?.driver?._id) {
      const driverBookings = await Booking.find({ driver: rahulUser.driver._id })
        .populate('user vehicle vendor')
        .sort({ createdAt: -1 });
      console.log(`\n6. Driver Dashboard Query (${driverBookings.length} bookings):`);
      driverBookings.forEach((b, i) => {
        console.log(`   ${i+1}. ${b.bookingId} - ${b.status}`);
      });
    } else {
      console.log('\n6. Driver Dashboard Query: FAILED - No driver ID linked to user');
    }

    // 7. Create a test booking to verify the flow
    console.log('\n7. Creating Test Booking...');
    const customerUser = await User.findOne({ email: 'customer@gmail.com' });
    const suvVehicle = vehicles.find(v => v.type === 'suv');
    
    if (customerUser && suvVehicle) {
      const testBooking = new Booking({
        bookingId: `TEST-${Date.now()}`,
        user: customerUser._id,
        vehicleType: suvVehicle._id,
        vehicle: suvVehicle._id,
        driver: suvVehicle.driver,
        vendor: suvVehicle.vendor,
        bookingType: 'instant',
        status: 'confirmed',
        pickup: {
          address: 'Test Pickup Location',
          coordinates: {
            type: 'Point',
            coordinates: [72.8777, 19.0760]
          },
          time: new Date()
        },
        drop: {
          address: 'Test Drop Location',
          coordinates: {
            type: 'Point',
            coordinates: [72.8877, 19.0860]
          },
          estimatedDistance: 5.2,
          estimatedTime: 15
        },
        fare: {
          base: 50,
          distance: 52,
          time: 15,
          total: 117,
          currency: 'INR'
        },
        payment: {
          method: 'cash',
          status: 'pending',
          amount: 117
        }
      });

      try {
        const savedBooking = await testBooking.save();
        console.log('   ✅ Test booking created successfully:', savedBooking.bookingId);
        
        // Verify it appears in queries
        const vendorCheck = await Booking.findOne({ _id: savedBooking._id, vendor: suvVehicle.vendor });
        const driverCheck = await Booking.findOne({ _id: savedBooking._id, driver: suvVehicle.driver });
        
        console.log('   Vendor query finds booking:', !!vendorCheck);
        console.log('   Driver query finds booking:', !!driverCheck);
        
      } catch (error) {
        console.log('   ❌ Test booking failed:', error.message);
        console.log('   Validation errors:', error.errors);
      }
    } else {
      console.log('   ❌ Missing customer user or SUV vehicle');
    }

    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debugBookingFlow();
