const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './src/.env' });

async function manualDbFix() {
  const client = new MongoClient(process.env.MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // 1. Check current state
    const users = await db.collection('users').find({}).toArray();
    const drivers = await db.collection('drivers').find({}).toArray();
    const vehicles = await db.collection('vehicles').find({}).toArray();
    const bookings = await db.collection('bookings').find({}).toArray();
    
    console.log(`Found: ${users.length} users, ${drivers.length} drivers, ${vehicles.length} vehicles, ${bookings.length} bookings`);
    
    // 2. Find Rahul's records
    const rahulUser = users.find(u => u.email === 'RahulSharma@gmail.com');
    const rahulDriver = drivers.find(d => d.name === 'Rahul Sharma');
    
    console.log('Rahul User:', rahulUser ? 'Found' : 'Not found');
    console.log('Rahul Driver:', rahulDriver ? 'Found' : 'Not found');
    console.log('Current driver link:', rahulUser?.driver);
    
    // 3. Fix the user-driver link
    if (rahulUser && rahulDriver) {
      const result = await db.collection('users').updateOne(
        { _id: rahulUser._id },
        { $set: { driver: rahulDriver._id } }
      );
      console.log('Updated user-driver link:', result.modifiedCount > 0 ? 'Success' : 'No change');
    }
    
    // 4. Verify vehicle-driver associations
    const suvVehicle = vehicles.find(v => v.type === 'suv');
    if (suvVehicle && rahulDriver) {
      if (!suvVehicle.driver || suvVehicle.driver.toString() !== rahulDriver._id.toString()) {
        await db.collection('vehicles').updateOne(
          { _id: suvVehicle._id },
          { $set: { driver: rahulDriver._id } }
        );
        console.log('Fixed SUV-driver association');
      } else {
        console.log('SUV-driver association already correct');
      }
    }
    
    // 5. Create a test booking to verify the flow works
    const customerUser = users.find(u => u.email === 'customer@gmail.com');
    const vendor = await db.collection('vendors').findOne({});
    
    if (customerUser && suvVehicle && vendor && rahulDriver) {
      const testBooking = {
        bookingId: `TEST-${Date.now()}`,
        user: customerUser._id,
        vehicleType: suvVehicle._id,
        vehicle: suvVehicle._id,
        driver: rahulDriver._id,
        vendor: vendor._id,
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await db.collection('bookings').insertOne(testBooking);
      console.log('Test booking created:', insertResult.insertedId ? 'Success' : 'Failed');
      
      // Verify queries work
      const vendorBookings = await db.collection('bookings').find({ vendor: vendor._id }).toArray();
      const driverBookings = await db.collection('bookings').find({ driver: rahulDriver._id }).toArray();
      
      console.log(`Vendor can see ${vendorBookings.length} bookings`);
      console.log(`Driver can see ${driverBookings.length} bookings`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

manualDbFix();
