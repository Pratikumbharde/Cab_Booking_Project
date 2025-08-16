import { useEffect } from 'react';
import { useGet } from '../hooks/useApi';
import { useSocket } from '../context/SocketContext';
import { Box, CircularProgress, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';

const BookingsList = () => {
  const { data: bookings, isLoading, error, refetch } = useGet('bookings', '/bookings');
  const { socket, isConnected } = useSocket();

  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleBookingUpdate = (updatedBooking) => {
      // Invalidate the bookings query to trigger a refetch
      refetch();
    };

    socket.on('booking:updated', handleBookingUpdate);
    socket.on('booking:created', handleBookingUpdate);
    socket.on('booking:deleted', handleBookingUpdate);

    return () => {
      socket.off('booking:updated', handleBookingUpdate);
      socket.off('booking:created', handleBookingUpdate);
      socket.off('booking:deleted', handleBookingUpdate);
    };
  }, [socket, refetch]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">
          Error loading bookings: {error.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Bookings</Typography>
        <Typography variant="caption" color={isConnected ? 'success.main' : 'error.main'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Typography>
      </Box>
      
      {bookings?.length > 0 ? (
        <List>
          {bookings.map((booking) => (
            <ListItem key={booking._id} divider>
              <ListItemText 
                primary={booking.name || `Booking #${booking._id}`}
                secondary={`Status: ${booking.status} | Created: ${new Date(booking.createdAt).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No bookings found.
        </Typography>
      )}
    </Paper>
  );
};

export default BookingsList;
