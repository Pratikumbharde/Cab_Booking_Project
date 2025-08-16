import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load environment variables
config({ path: './src/.env' });

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const bookingsCollection = db.collection('bookings');

    // Find bookings without vendor field
    const orphanedBookings = await bookingsCollection.find({ 
      $or: [
        { vendor: { $exists: false } },
        { vendor: null }
      ]
    }).toArray();

    console.log(`Found ${orphanedBookings.length} orphaned bookings`);

    if (orphanedBookings.length > 0) {
      // Show details of orphaned bookings
      orphanedBookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ID: ${booking.bookingId || booking._id}`);
        console.log(`   User: ${booking.user}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Created: ${booking.createdAt}`);
      });

      // Delete orphaned bookings
      const deleteResult = await bookingsCollection.deleteMany({
        $or: [
          { vendor: { $exists: false } },
          { vendor: null }
        ]
      });

      console.log(`\nDeleted ${deleteResult.deletedCount} orphaned bookings`);
    }

    // Show remaining bookings count
    const remainingCount = await bookingsCollection.countDocuments();
    console.log(`Remaining bookings: ${remainingCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

cleanup();
