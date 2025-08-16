import { api } from '../api';

export const bookRide = async (rideData, userId) => {
  // Add required fields for the booking
  const bookingData = {
    ...rideData,
    bookingType: rideData.date ? 'scheduled' : 'instant',
    status: 'pending',
    fare: {
      base: 50, // Base fare in INR
      distance: 10, // Per km rate
      time: 1,    // Per minute rate
      total: 100, // This should be calculated based on distance and time
      currency: 'INR',
      isPaid: false
    },
    payment: {
      method: 'cash',
      status: 'pending'
    },
    user: userId // Set the user ID from auth context
    // Vendor will be assigned by the backend
  };

  const response = await api.post('/ride/book', bookingData);
  return response.data;
};

export const getRideHistory = async (userId) => {
  const response = await api.get('/ride/history');
  return response.data.data || []; // Extract the data array from the response
};
