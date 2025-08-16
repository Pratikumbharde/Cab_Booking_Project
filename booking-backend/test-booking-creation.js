const mongoose = require('mongoose');
const { config } = require('dotenv');

config({ path: './src/.env' });

async function testBookingCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test basic connection and collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Check users
    const users = await db.collection('users').find({}).toArray();
    console.log('\nUsers in database:');
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Role: ${u.role} - Driver: ${u.driver || 'None'}`);
    });

    // Check drivers
    const drivers = await db.collection('drivers').find({}).toArray();
    console.log('\nDrivers in database:');
    drivers.forEach(d => {
      console.log(`- ${d.name} - Phone: ${d.phone} - Vendor: ${d.vendor}`);
    });

    // Check vehicles
    const vehicles = await db.collection('vehicles').find({}).toArray();
    console.log('\nVehicles in database:');
    vehicles.forEach(v => {
      console.log(`- ${v.type} ${v.model} - Driver: ${v.driver || 'None'} - Vendor: ${v.vendor}`);
    });

    // Check bookings
    const bookings = await db.collection('bookings').find({}).toArray();
    console.log(`\nBookings in database: ${bookings.length}`);
    bookings.forEach(b => {
      console.log(`- ${b.bookingId} - Status: ${b.status} - User: ${b.user} - Driver: ${b.driver || 'None'}`);
    });

    // Fix Rahul's user-driver link
    const rahulUser = users.find(u => u.email === 'RahulSharma@gmail.com');
    const rahulDriver = drivers.find(d => d.name === 'Rahul Sharma');
    
    if (rahulUser && rahulDriver && !rahulUser.driver) {
      await db.collection('users').updateOne(
        { _id: rahulUser._id },
        { $set: { driver: rahulDriver._id } }
      );
      console.log('\n✅ Fixed Rahul user-driver link');
    } else if (rahulUser?.driver) {
      console.log('\n✅ Rahul user-driver link already exists');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

testBookingCreation();
