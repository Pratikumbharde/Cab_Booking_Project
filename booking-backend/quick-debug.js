import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: './src/.env' });

async function quickCheck() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  const bookingsCount = await mongoose.connection.db.collection('bookings').countDocuments();
  const usersCount = await mongoose.connection.db.collection('users').countDocuments();
  const vehiclesCount = await mongoose.connection.db.collection('vehicles').countDocuments();
  
  console.log('Bookings:', bookingsCount);
  console.log('Users:', usersCount);
  console.log('Vehicles:', vehiclesCount);
  
  // Check if Rahul user exists and has driver field
  const rahul = await mongoose.connection.db.collection('users').findOne({ email: 'RahulSharma@gmail.com' });
  console.log('Rahul user driver field:', rahul?.driver);
  
  process.exit(0);
}

quickCheck().catch(console.error);
