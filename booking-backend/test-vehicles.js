import mongoose from 'mongoose';
import Vehicle from './src/models/Vehicle.js';
import { config } from 'dotenv';

config({ path: './src/.env' });

async function testVehicles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const vehicles = await Vehicle.find({}).populate('vendor', 'name email').populate('driver', 'name');
    console.log(`Found ${vehicles.length} vehicles in database:`);
    
    vehicles.forEach((vehicle, index) => {
      console.log(`${index + 1}. ${vehicle.type} - ${vehicle.model} (${vehicle.plate})`);
      console.log(`   Available: ${vehicle.available}`);
      console.log(`   Vendor: ${vehicle.vendor?.name || 'No vendor'}`);
      console.log(`   Driver: ${vehicle.driver?.name || 'No driver'}`);
      console.log('');
    });
    
    // Test the available vehicles query
    const availableVehicles = await Vehicle.find({ 
      available: { $ne: false } 
    }).populate('vendor', 'name email phone').lean();
    
    console.log(`Available vehicles query returned: ${availableVehicles.length} vehicles`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testVehicles();
