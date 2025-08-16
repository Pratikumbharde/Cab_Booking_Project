// This module provides helper functions to emit booking/driver/vehicle/invoice events to vendors

let io = null;
const userSockets = new Map(); // userId -> socketId
const driverSockets = new Map(); // driverId -> socketId

/**
 * Initialize socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io server instance
 */
const initSocket = async (server) => {
  io = new (await import('socket.io')).Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 10000, // 10 seconds
    pingInterval: 25000, // 25 seconds
    maxHttpBufferSize: 1e8 // 100MB
  });

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', ({ userId, userType, token }) => {
      try {
        // In a real app, verify the token here
        if (userType === 'user') {
          userSockets.set(userId, socket.id);
          console.log(`User ${userId} connected with socket ${socket.id}`);
        } else if (userType === 'driver') {
          driverSockets.set(userId, socket.id);
          console.log(`Driver ${userId} connected with socket ${socket.id}`);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket ${socket.id} disconnected: ${reason}`);
      
      // Remove from userSockets
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`Removed user ${userId} from active connections`);
          break;
        }
      }

      // Remove from driverSockets
      for (const [driverId, socketId] of driverSockets.entries()) {
        if (socketId === socket.id) {
          driverSockets.delete(driverId);
          console.log(`Removed driver ${driverId} from active connections`);
          break;
        }
      }
    });

    // Handle ride status updates
    socket.on('ride:status', (data) => {
      const { rideId, status, userId, driverId } = data;
      console.log(`Ride ${rideId} status updated to ${status}`);
      
      // Notify user about ride status change
      if (userId && userSockets.has(userId)) {
        io.to(userSockets.get(userId)).emit('ride:status', { rideId, status });
      }
      
      // Notify driver about ride status change
      if (driverId && driverSockets.has(driverId)) {
        io.to(driverSockets.get(driverId)).emit('ride:status', { rideId, status });
      }
    });

    // Handle location updates
    socket.on('location:update', (data) => {
      const { userId, driverId, location } = data;
      
      // If it's a driver location update, notify the user
      if (driverId && userId) {
        if (userSockets.has(userId)) {
          io.to(userSockets.get(userId)).emit('driver:location', { 
            driverId, 
            location 
          });
        }
      }
    });

    // Handle chat messages
    socket.on('chat:message', (data) => {
      const { to, from, message, rideId } = data;
      
      // Determine if the message is to a user or driver
      const targetSocketId = userSockets.get(to) || driverSockets.get(to);
      
      if (targetSocketId) {
        io.to(targetSocketId).emit('chat:message', {
          from,
          message,
          rideId,
          timestamp: new Date()
        });
      }
    });
  });

  return io;
};

/**
 * Emit event to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToUser = (userId, event, data) => {
  if (userSockets.has(userId)) {
    io.to(userSockets.get(userId)).emit(event, data);
  } else {
    console.warn(`User ${userId} is not connected`);
  }
};

/**
 * Emit event to a specific driver
 * @param {string} driverId - Driver ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToDriver = (driverId, event, data) => {
  if (driverSockets.has(driverId)) {
    io.to(driverSockets.get(driverId)).emit(event, data);
  } else {
    console.warn(`Driver ${driverId} is not connected`);
  }
};

/**
 * Emit event to all connected users
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToAllUsers = (event, data) => {
  userSockets.forEach((socketId) => {
    io.to(socketId).emit(event, data);
  });
};

/**
 * Emit event to all connected drivers
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToAllDrivers = (event, data) => {
  driverSockets.forEach((socketId) => {
    io.to(socketId).emit(event, data);
  });
};

/**
 * Get socket ID for a user
 * @param {string} userId - User ID
 * @returns {string|null} Socket ID or null if not found
 */
const getUserSocket = (userId) => {
  return userSockets.get(userId) || null;
};

/**
 * Get socket ID for a driver
 * @param {string} driverId - Driver ID
 * @returns {string|null} Socket ID or null if not found
 */
const getDriverSocket = (driverId) => {
  return driverSockets.get(driverId) || null;
};

/**
 * Check if a user is online
 * @param {string} userId - User ID
 * @returns {boolean} True if user is online
 */
const isUserOnline = (userId) => {
  return userSockets.has(userId);
};

/**
 * Check if a driver is online
 * @param {string} driverId - Driver ID
 * @returns {boolean} True if driver is online
 */
const isDriverOnline = (driverId) => {
  return driverSockets.has(driverId);
};

/**
 * Set the io instance for use in other modules
 * @param {Object} ioInstance - Socket.io instance
 */
const setSocketIO = (ioInstance) => {
  io = ioInstance;
};

/**
 * Emit event to a specific vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToVendor = (vendorId, event, data) => {
  // In this implementation, we'll treat vendor notifications the same as user notifications
  // You might want to implement a separate vendorSockets map if needed
  emitToUser(vendorId, event, data);
};

/**
 * Emit event to all connected vendors
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
const emitToAllVendors = (event, data) => {
  // In this implementation, we'll broadcast to all users
  // You might want to implement a separate vendorSockets map if needed
  emitToAllUsers(event, data);
};

export {
  initSocket,
  emitToUser,
  emitToDriver,
  emitToVendor,
  emitToAllUsers,
  emitToAllDrivers,
  emitToAllVendors,
  getUserSocket,
  getDriverSocket,
  isUserOnline,
  isDriverOnline,
  setSocketIO
};
