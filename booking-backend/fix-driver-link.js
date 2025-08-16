import mongoose from 'mongoose';
import User from './src/models/User.js';
import Driver from './src/models/Driver.js';
import { config } from 'dotenv';

config({ path: './src/.env' });

async function fixDriverLink() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find Rahul's user and driver records
    const driverUser = await User.findOne({ email: 'RahulSharma@gmail.com' });
    const rahulDriver = await Driver.findOne({ name: 'Rahul Sharma' });

    console.log('Driver User found:', !!driverUser);
    console.log('Driver Record found:', !!rahulDriver);
    console.log('Current driver field:', driverUser?.driver);

    if (driverUser && rahulDriver) {
      // Update the user record to link to driver
      await User.updateOne(
        { _id: driverUser._id },
        { $set: { driver: rahulDriver._id } }
      );
      console.log('✅ Successfully linked driver user to driver record');
      
      // Verify the update
      const updatedUser = await User.findById(driverUser._id);
      console.log('Updated driver field:', updatedUser.driver);
    } else {
      console.log('❌ Missing user or driver record');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixDriverLink();
