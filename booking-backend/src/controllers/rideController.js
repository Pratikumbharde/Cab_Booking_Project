import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { emitToUser, emitToDriver } from '../utils/socket.js';

// Rate limiting for Nominatim
let lastRequestTime = 0;
const RATE_LIMIT_MS = 1000; // 1 request per second (Nominatim's limit)

// Helper function to get coordinates from address using Nominatim
async function geocodeAddress(address) {
  console.log('Geocoding address:', address);
  
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }

  try {
    const url = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
    console.log('Using Nominatim URL:', url);
    
    const response = await axios.get(`${url}/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1,
        addressdetails: 1,
        'accept-language': 'en',
        countrycodes: 'in',  // Focus on India
        viewbox: '68.17665,8.07647,97.40238,37.09662',  // Rough bounding box of India
        bounded: 1
      },
      headers: {
        'User-Agent': 'BookingApp/1.0 (your@email.com)' // Required by Nominatim
      },
      timeout: 5000 // 5 second timeout
    });

    lastRequestTime = Date.now();
    console.log('Geocoding response:', response.data);

    if (response.data && response.data.length > 0) {
      const result = {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon),
        address: response.data[0].display_name
      };
      console.log('Geocoding successful:', result);
      return result;
    }
    
    console.error('No results found for address:', address);
    throw new Error('Address not found in the specified area');
    
  } catch (error) {
    console.error('Geocoding error details:', {
      message: error.message,
      response: error.response?.data,
      address: address
    });
    throw new Error(`Could not find the specified address: ${address}`);
  }
}

// Helper function to get route information using OSRM
async function getRouteInfo(pickup, drop) {
  const startTime = Date.now();
  
  try {
    console.log('Calculating route between:', {
      pickup: { lat: pickup.lat, lng: pickup.lng },
      drop: { lat: drop.lat, lng: drop.lng }
    });

    const osrmUrl = process.env.OSRM_URL || 'https://router.project-osrm.org';
    const coordinates = `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}`;
    const url = `${osrmUrl}/route/v1/driving/${coordinates}`;
    
    console.log('OSRM Request URL:', url);

    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        steps: false,
        alternatives: false
      },
      timeout: 10000 // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    console.log(`OSRM Response (${responseTime}ms):`, {
      status: response.status,
      data: response.data ? 'data received' : 'no data',
      waypoints: response.data?.waypoints?.length,
      routes: response.data?.routes?.length
    });

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('No route found in response');
    }

    const route = response.data.routes[0];
    
    if (!route.distance || !route.duration) {
      throw new Error('Invalid route data received');
    }

    const result = {
      distance: Math.round((route.distance / 1000) * 10) / 10, // Convert to km, 1 decimal
      duration: Math.ceil(route.duration / 60), // Convert to minutes, rounded up
      geometry: route.geometry
    };

    console.log('Route calculated:', result);
    return result;
    
  } catch (error) {
    const errorDetails = {
      message: error.message,
      code: error.code,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params
      },
      response: {
        status: error.response?.status,
        data: error.response?.data
      },
      coordinates: {
        pickup: pickup ? { lat: pickup.lat, lng: pickup.lng } : 'invalid',
        drop: drop ? { lat: drop.lat, lng: drop.lng } : 'invalid'
      }
    };
    
    console.error('Routing error details:', JSON.stringify(errorDetails, null, 2));
    
    // Provide a fallback route if the real one fails
    if (pickup && drop) {
      console.log('Using fallback distance calculation');
      // Simple haversine distance calculation as fallback
      const R = 6371; // Earth's radius in km
      const dLat = (drop.lat - pickup.lat) * Math.PI / 180;
      const dLon = (drop.lng - pickup.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickup.lat * Math.PI / 180) * Math.cos(drop.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Estimate time based on average city driving speed of 30 km/h
      const duration = (distance / 30) * 60; // in minutes
      
      return {
        distance: Math.round(distance * 10) / 10,
        duration: Math.ceil(duration),
        geometry: {
          type: 'LineString',
          coordinates: [
            [pickup.lng, pickup.lat],
            [drop.lng, drop.lat]
          ]
        },
        isFallback: true
      };
    }
    
    throw new Error('Could not calculate route. Please try again with different locations.');
  }
}

export const estimateFare = async (req, res) => {
  try {
    const { pickup, drop, vehicleType } = req.body;

    if (!pickup || !drop || !vehicleType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get coordinates for pickup and drop locations
    const [pickupLocation, dropLocation] = await Promise.all([
      typeof pickup === 'string' ? geocodeAddress(pickup) : Promise.resolve(pickup),
      typeof drop === 'string' ? geocodeAddress(drop) : Promise.resolve(drop)
    ]);

    // Get route information
    const routeInfo = await getRouteInfo(pickupLocation, dropLocation);

    // Calculate fare (example pricing)
    const baseFare = 50; // Base fare in INR
    const perKmRate = 12; // Per km rate in INR
    const perMinuteRate = 1; // Per minute rate in INR
    const minFare = 80; // Minimum fare in INR

    let fare = baseFare + 
              (routeInfo.distance * perKmRate) + 
              (routeInfo.duration * perMinuteRate);
    
    fare = Math.max(fare, minFare);

    res.json({
      success: true,
      data: {
        pickup: pickupLocation,
        drop: dropLocation,
        distance: parseFloat(routeInfo.distance.toFixed(2)),
        duration: Math.ceil(routeInfo.duration),
        fare: Math.ceil(fare),
        vehicleType
      }
    });
  } catch (error) {
    console.error('Estimate fare error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to estimate fare'
    });
  }
};

export const bookRide = async (req, res) => {
  try {
    console.log('Book ride request received:', { 
      user: req.user, 
      body: req.body 
    });
    
    const user = req.user; // User is already attached by auth middleware
    
    if (!user || !user._id) {
      console.error('No user in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    let { pickup, drop, vehicleType, paymentMethod } = req.body;
    vehicleType = vehicleType || 'sedan';
    paymentMethod = paymentMethod || 'cash';

    // Validate required fields
    if (!pickup || !drop || !pickup.coordinates || !drop.coordinates) {
      console.error('Missing required fields:', { pickup, drop });
      return res.status(400).json({ 
        message: 'Missing required fields. Please provide pickup and drop locations with coordinates.' 
      });
    }

    // Process coordinates - ensure they're in the correct format [lng, lat]
    const processCoordinates = (location) => {
      if (!location || !location.coordinates) return null;
      
      // Handle different coordinate formats
      let lng, lat;
      if (Array.isArray(location.coordinates)) {
        [lng, lat] = location.coordinates;
      } else if (location.coordinates.lng !== undefined && location.coordinates.lat !== undefined) {
        lng = location.coordinates.lng;
        lat = location.coordinates.lat;
      } else if (location.coordinates.coordinates) {
        [lng, lat] = location.coordinates.coordinates;
      } else {
        throw new Error('Invalid coordinates format');
      }
      
      // Ensure coordinates are numbers
      lng = parseFloat(lng);
      lat = parseFloat(lat);
      
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error('Invalid coordinate values');
      }
      
      return { lng, lat, address: location.address || 'Unknown location' };
    };

    // Process pickup and drop locations
    const pickupLocation = processCoordinates(pickup);
    const dropLocation = processCoordinates(drop);
    
    if (!pickupLocation || !dropLocation) {
      throw new Error('Invalid pickup or drop location coordinates');
    }

    // Get route information
    let routeInfo;
    try {
      routeInfo = await getRouteInfo(pickupLocation, dropLocation);
    } catch (error) {
      console.error('Error getting route info:', error);
      // Create a fallback route info
      routeInfo = {
        distance: 5, // Default distance in km
        duration: 15, // Default duration in minutes
        geometry: {
          type: 'LineString',
          coordinates: [
            [pickupLocation.lng, pickupLocation.lat],
            [dropLocation.lng, dropLocation.lat]
          ]
        },
        isFallback: true
      };
    }

    // Ensure we have valid numbers for calculations
    const distance = parseFloat(routeInfo.distance) || 0;
    const duration = parseFloat(routeInfo.duration) || 0;

    // Calculate fare
    const baseFare = 50;
    const perKmRate = 12;
    const perMinuteRate = 1;
    const minFare = 80;

    const distanceFare = distance * perKmRate;
    const timeFare = duration * perMinuteRate;
    let totalFare = baseFare + distanceFare + timeFare;
    totalFare = Math.max(totalFare, minFare);

    // Find a vehicle to assign to this booking (for vendor association)
    let assignedVehicle = null;
    let assignedVendor = null;
    
    try {
      const Vehicle = mongoose.model('Vehicle');
      
      // Check if vehicleType is an ObjectId (vehicle ID) or a string (vehicle type)
      if (mongoose.Types.ObjectId.isValid(vehicleType)) {
        // vehicleType is actually a vehicle ID
        assignedVehicle = await Vehicle.findById(vehicleType).populate('vendor').populate('driver');
        console.log('Found vehicle by ID:', vehicleType);
      } else {
        // vehicleType is a string, find by type
        assignedVehicle = await Vehicle.findOne({ 
          type: vehicleType,
          available: { $ne: false }
        }).populate('vendor').populate('driver');
        console.log('Found vehicle by type:', vehicleType);
      }
      
      if (assignedVehicle && assignedVehicle.vendor) {
        assignedVendor = assignedVehicle.vendor._id;
        console.log('Assigned vehicle:', assignedVehicle._id, 'from vendor:', assignedVendor);
      } else {
        console.log('No vehicle found or no vendor associated');
      }
    } catch (error) {
      console.error('Error finding vehicle for booking:', error);
    }

    // Auto-assign driver based on vehicle
    let assignedDriver = null;
    if (assignedVehicle && assignedVehicle.driver) {
      assignedDriver = assignedVehicle.driver._id || assignedVehicle.driver;
      console.log('Auto-assigned driver:', assignedDriver, 'for vehicle:', assignedVehicle._id);
    }

    // Create booking with proper data structure
    const booking = new Booking({
      bookingId: `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: user._id,
      vehicleType: assignedVehicle ? assignedVehicle._id : vehicleType,
      vehicle: assignedVehicle ? assignedVehicle._id : null,
      driver: assignedDriver,
      vendor: assignedVendor,
      bookingType: 'instant',
      status: 'confirmed',
      pickup: {
        address: pickup.address || 'Pickup location',
        coordinates: {
          type: 'Point',
          coordinates: [pickupLocation.lng, pickupLocation.lat]
        },
        time: new Date()
      },
      drop: {
        address: drop.address || 'Drop location',
        coordinates: {
          type: 'Point',
          coordinates: [dropLocation.lng, dropLocation.lat]
        },
        estimatedDistance: parseFloat(distance.toFixed(2)),
        estimatedTime: Math.ceil(duration)
      },
      fare: {
        base: baseFare,
        distance: parseFloat(distanceFare.toFixed(2)),
        time: parseFloat(timeFare.toFixed(2)),
        total: Math.ceil(totalFare),
        currency: 'INR'
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'online' ? 'pending' : 'pending',
        amount: Math.ceil(totalFare)
      },
      route: routeInfo.geometry
    });

    // Save booking
    const savedBooking = await booking.save();
    
    // Populate the saved booking for response
    await savedBooking.populate('vehicle driver vendor user');

    // Emit event to user
    emitToUser(user._id.toString(), 'booking:created', savedBooking);
    
    // Emit event to vendor if assigned
    if (assignedVendor) {
      const { emitToVendor } = await import('../utils/socket.js');
      emitToVendor(assignedVendor.toString(), 'booking:new', savedBooking);
      console.log('Notified vendor:', assignedVendor, 'of new booking:', savedBooking.bookingId);
    }

    res.status(201).json({
      success: true,
      booking: savedBooking,
      estimatedFare: totalFare
    });
  } catch (error) {
    console.error('Book ride error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to book ride'
    });
  }
};

export const getRideDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('user', 'name email phone')
      .populate('driver', 'name phone vehicle')
      .lean();

    if (!booking) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if the user is authorized to view this ride
    if (booking.user._id.toString() !== req.user.userId && 
        (booking.driver && booking.driver._id.toString() !== req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to view this ride' });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get ride details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ride details'
    });
  }
};

export const cancelRide = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(id).session(session);
    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Ride not found' });
    }

    // Check if the user is authorized to cancel this ride
    if (booking.user.toString() !== req.user.userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized to cancel this ride' });
    }

    // Check if the ride can be cancelled
    if (['cancelled', 'completed', 'in_progress'].includes(booking.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: `Cannot cancel ride with status: ${booking.status}` 
      });
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellation = {
      reason,
      cancelledBy: 'user',
      cancelledAt: new Date()
    };

    // Handle refund if payment was made online
    if (booking.payment.method === 'online' && booking.payment.status === 'completed') {
      // Implement refund logic here
      // This would typically involve calling your payment gateway's API
      booking.payment.status = 'refunded';
      booking.payment.refundedAt = new Date();
    }

    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Notify driver if assigned
    if (booking.driver) {
      emitToDriver(booking.driver.toString(), 'ride:cancelled', {
        bookingId: booking._id,
        reason
      });
    }

    res.json({
      success: true,
      message: 'Ride cancelled successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel ride'
    });
  }
};

export const getRideHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { user: req.user._id || req.user.userId };
    if (status) {
      query.status = status;
    }

    console.log('Fetching ride history for user:', req.user._id || req.user.userId);
    console.log('Query:', query);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('driver', 'name phone')
        .populate('vehicle', 'name model')
        .populate('vendor', 'email')
        .lean(),
      Booking.countDocuments(query)
    ]);

    console.log(`Found ${bookings.length} bookings for user ${req.user._id || req.user.userId}`);
    bookings.forEach(booking => {
      console.log(`- Booking ${booking.bookingId}: vendor=${booking.vendor?.email || 'none'}, vehicle=${booking.vehicle?._id || 'none'}`);
    });

    res.json({
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching ride history:', error);
    res.status(500).json({ 
      message: 'Error fetching ride history',
      error: error.message 
    });
  }
};
