import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Vendor from './models/Vendor.js';
import Driver from './models/Driver.js';
import Vehicle from './models/Vehicle.js';
import Booking from './models/Booking.js';
import Invoice from './models/Invoice.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/booking_portal';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Booking.deleteMany({});
    await User.deleteMany({});
    await Vendor.deleteMany({});
    await Driver.deleteMany({});
    await Vehicle.deleteMany({});
    await Invoice.deleteMany({});

    // Create vendor
    const vendorEmail = 'vendor@gmail.com';
    const userEmail = 'user@gmail.com';
    const password = 'Password@123';
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const vendor = await Vendor.create({
      name: 'City Cabs',
      email: vendorEmail,
      password: hashedPassword,
      phone: '9876543210',
      address: '123 Main Street, City',
      whitelisted: true,
      bankInfo: { 
        accountNumber: '1234567890', 
        ifsc: 'CITY0001', 
        bankName: 'City Bank', 
        branch: 'Main Branch' 
      }
    });

    // Create vendor admin user
    const vendorAdmin = await User.create({
      name: 'Vendor Admin',
      email: vendorEmail,
      password: hashedPassword,
      role: 'vendor',
      vendor: vendor._id,
      phone: '9876543210'
    });

    // Create driver user if it doesn't exist
    let driverUser = await User.findOne({ email: 'RahulSharma@gmail.com' });
    if (!driverUser) {
      driverUser = await User.create({
        name: 'Rahul Sharma',
        email: 'RahulSharma@gmail.com',
        password: await bcrypt.hash('Password@123', 10),
        phone: '+91-9876543212',
        role: 'driver'
      });
      console.log('Created driver user');
    } else {
      console.log('Driver user already exists');
    }

    // Create regular user
    const user = await User.create({
      name: 'John Doe',
      email: userEmail,
      password: hashedPassword,
      role: 'customer',
      phone: '9876543211',
      address: '456 Park Avenue, City'
    });

    console.log('\n=== Seeded Accounts ===');
    console.log('Vendor Login:');
    console.log(`Email: ${vendorEmail}`);
    console.log(`Password: ${password}\n`);
    
    console.log('User Login:');
    console.log(`Email: ${userEmail}`);
    console.log(`Password: ${password}\n`);

    // Create vehicles first
    const vehicles = await Vehicle.insertMany([
      {
        type: 'suv',
        plate: 'DL01AB1234',
        model: 'Toyota Innova Crysta',
        insurance: 'VALID',
        condition: 'Excellent',
        available: true,
        vendor: vendor._id,
        driver: null, // Will be updated after driver creation
        year: 2022,
        color: 'White',
        seatingCapacity: 7,
        pricePerKm: 15,
        currentLocation: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // Mumbai coordinates
        }
      },
      {
        type: 'sedan',
        plate: 'DL02CD5678',
        model: 'Honda City',
        insurance: 'VALID',
        condition: 'Good',
        available: true,
        vendor: vendor._id,
        driver: null,
        year: 2021,
        color: 'Silver',
        seatingCapacity: 5,
        pricePerKm: 12,
        currentLocation: {
          type: 'Point',
          coordinates: [72.8777, 19.0760] // Mumbai coordinates
        }
      },
      {
        type: 'hatchback',
        plate: 'MH12EF9012',
        model: 'Maruti Swift',
        insurance: 'VALID',
        condition: 'Good',
        available: true,
        vendor: vendor._id,
        driver: null,
        year: 2023,
        color: 'Red',
        seatingCapacity: 5,
        pricePerKm: 10,
        currentLocation: {
          type: 'Point',
          coordinates: [72.8877, 19.0860] // Slightly different Mumbai location
        }
      },
      {
        type: 'luxury',
        plate: 'DL03GH3456',
        model: 'BMW 3 Series',
        insurance: 'VALID',
        condition: 'Excellent',
        available: true,
        vendor: vendor._id,
        driver: null,
        year: 2023,
        color: 'Black',
        seatingCapacity: 5,
        pricePerKm: 25,
        currentLocation: {
          type: 'Point',
          coordinates: [72.8677, 19.0660] // Different Mumbai area
        }
      },
      {
        type: 'minivan',
        plate: 'KA05IJ7890',
        model: 'Toyota Hiace',
        insurance: 'VALID',
        condition: 'Good',
        available: true,
        vendor: vendor._id,
        driver: null,
        year: 2020,
        color: 'White',
        seatingCapacity: 12,
        pricePerKm: 18,
        currentLocation: {
          type: 'Point',
          coordinates: [72.8977, 19.0960] // Another Mumbai location
        }
      }
    ]);

    // Create drivers with vehicle references
    const drivers = await Driver.insertMany([
      {
        name: 'Rahul Sharma',
        phone: '+919876543210',
        licenseNumber: 'DL12345678901234',
        aadhar: '123456789012',
        pan: 'ABCDE1234F',
        address: '123 MG Road, Mumbai, Maharashtra 400001',
        bankInfo: {
          accountNumber: '1234567890123456',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branch: 'Mumbai Main'
        },
        vendor: vendor._id
      },
      {
        name: 'Vikram Singh',
        phone: '+919876543211',
        licenseNumber: 'DL12345678904321',
        aadhar: '987654321098',
        pan: 'FGHIJ5678K',
        address: '456 Brigade Road, Mumbai, Maharashtra 400002',
        bankInfo: {
          accountNumber: '9876543210987654',
          ifsc: 'ICICI0005678',
          bankName: 'ICICI Bank',
          branch: 'Mumbai Central'
        },
        vendor: vendor._id
      },
      {
        name: 'Amit Kumar',
        phone: '+919876543212',
        licenseNumber: 'DL98765432109876',
        aadhar: '456789123456',
        pan: 'KLMNO9012P',
        address: '789 Linking Road, Mumbai, Maharashtra 400003',
        bankInfo: {
          accountNumber: '4567891234567890',
          ifsc: 'SBI0009012',
          bankName: 'State Bank of India',
          branch: 'Mumbai West'
        },
        vendor: vendor._id
      },
      {
        name: 'Suresh Patel',
        phone: '+919876543213',
        licenseNumber: 'DL11223344556677',
        aadhar: '789123456789',
        pan: 'PQRST3456U',
        address: '321 Juhu Beach Road, Mumbai, Maharashtra 400004',
        bankInfo: {
          accountNumber: '7891234567890123',
          ifsc: 'AXIS0003456',
          bankName: 'Axis Bank',
          branch: 'Mumbai North'
        },
        vendor: vendor._id
      },
      {
        name: 'Ravi Gupta',
        phone: '+919876543214',
        licenseNumber: 'DL99887766554433',
        aadhar: '321654987321',
        pan: 'VWXYZ7890A',
        address: '654 Andheri East, Mumbai, Maharashtra 400005',
        bankInfo: {
          accountNumber: '3216549873216549',
          ifsc: 'KOTAK0007890',
          bankName: 'Kotak Mahindra Bank',
          branch: 'Mumbai East'
        },
        vendor: vendor._id
      }
    ]);

    // Update vehicles with driver references
    await Vehicle.findByIdAndUpdate(vehicles[0]._id, { driver: drivers[0]._id }); // SUV -> Rahul
    await Vehicle.findByIdAndUpdate(vehicles[1]._id, { driver: drivers[1]._id }); // Sedan -> Vikram
    await Vehicle.findByIdAndUpdate(vehicles[2]._id, { driver: drivers[2]._id }); // Hatchback -> Amit
    await Vehicle.findByIdAndUpdate(vehicles[3]._id, { driver: drivers[3]._id }); // Luxury -> Suresh
    await Vehicle.findByIdAndUpdate(vehicles[4]._id, { driver: drivers[4]._id }); // Minivan -> Ravi

    // Link driver user to driver record
    const rahulDriver = drivers.find(driver => driver.name === 'Rahul Sharma');
    if (driverUser && rahulDriver) {
      driverUser.driver = rahulDriver._id;
      await driverUser.save();
      console.log('Linked driver user to driver record:', rahulDriver._id);
    }

    // Create sample bookings
    console.log('Creating sample bookings...');
    const sampleBookings = [
      {
        bookingId: 'BK001',
        user: user._id,
        vehicleType: vehicles[0]._id,
        bookingType: 'instant',
        status: 'completed',
        pickup: {
          address: 'Mumbai Airport Terminal 1, Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8777, 19.0896]
          },
          time: new Date('2024-01-15T10:00:00Z'),
          notes: 'Near Gate 1A'
        },
        drop: {
          address: 'Bandra West, Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8261, 19.0596]
          },
          estimatedTime: 45,
          estimatedDistance: 15.2,
          notes: 'Linking Road'
        },
        fare: {
          base: 50,
          distance: 152,
          time: 45,
          surge: 1.0,
          total: 247,
          currency: 'INR',
          isPaid: true
        },
        payment: {
          method: 'upi',
          status: 'completed',
          amount: 247,
          transactionId: 'TXN123456789'
        },
        driver: drivers[0]._id,
        vehicle: vehicles[0]._id,
        vendor: vendor._id,
        rating: {
          driver: 5,
          vehicle: 4,
          feedback: 'Great ride, very professional driver',
          submittedAt: new Date('2024-01-15T11:30:00Z')
        },
        actualDistance: 15.8,
        actualDuration: 50,
        startTime: new Date('2024-01-15T10:15:00Z'),
        endTime: new Date('2024-01-15T11:05:00Z')
      },
      {
        bookingId: 'BK002',
        user: user._id,
        vehicleType: vehicles[1]._id,
        bookingType: 'scheduled',
        status: 'confirmed',
        pickup: {
          address: 'Powai, Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.9081, 19.1176]
          },
          time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          notes: 'Near Hiranandani Gardens'
        },
        drop: {
          address: 'Andheri East, Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8697, 19.1136]
          },
          estimatedTime: 25,
          estimatedDistance: 8.5
        },
        fare: {
          base: 50,
          distance: 85,
          time: 25,
          surge: 1.2,
          total: 162,
          currency: 'INR',
          isPaid: false
        },
        payment: {
          method: 'cash',
          status: 'pending',
          amount: 162
        },
        driver: drivers[1]._id,
        vehicle: vehicles[1]._id,
        vendor: vendor._id
      },
      {
        bookingId: 'BK003',
        user: user._id,
        vehicleType: vehicles[2]._id,
        bookingType: 'instant',
        status: 'in_ride',
        pickup: {
          address: 'Juhu Beach, Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8265, 19.1075]
          },
          time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          notes: 'Near JVPD'
        },
        drop: {
          address: 'Versova, Mumbai, Maharashtra',
          coordinates: {
            type: 'Point',
            coordinates: [72.8081, 19.1317]
          },
          estimatedTime: 20,
          estimatedDistance: 6.2
        },
        fare: {
          base: 50,
          distance: 155,
          time: 20,
          surge: 1.0,
          total: 225,
          currency: 'INR',
          isPaid: false
        },
        payment: {
          method: 'card',
          status: 'pending',
          amount: 225
        },
        driver: drivers[2]._id,
        vehicle: vehicles[2]._id,
        vendor: vendor._id,
        startTime: new Date(Date.now() - 15 * 60 * 1000) // Started 15 minutes ago
      }
    ];

    const bookings = await Booking.insertMany(sampleBookings);
    console.log(`Created ${bookings.length} sample bookings`);

    // Create sample invoices
    console.log('Creating sample invoices...');
    const sampleInvoices = [
      {
        booking: bookings[0]._id,
        vendor: vendor._id,
        amount: 247,
        status: 'Paid',
        submittedAt: new Date('2024-01-15T11:30:00Z'),
        paidAt: new Date('2024-01-16T09:00:00Z'),
        reportMonth: '2024-01'
      },
      {
        booking: bookings[1]._id,
        vendor: vendor._id,
        amount: 162,
        status: 'Pending',
        submittedAt: new Date(),
        reportMonth: '2024-01'
      },
      {
        booking: bookings[2]._id,
        vendor: vendor._id,
        amount: 225,
        status: 'Pending',
        submittedAt: new Date(),
        reportMonth: '2024-01'
      }
    ];

    const invoices = await Invoice.insertMany(sampleInvoices);
    console.log(`Created ${invoices.length} sample invoices`);

    console.log('✅ Seed data created successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seed();