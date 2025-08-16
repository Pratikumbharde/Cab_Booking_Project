import { useEffect, useState, useMemo } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, ButtonGroup, Typography, Alert, CircularProgress, Box,
  Chip, IconButton, Tooltip, Avatar
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AccessTime as PendingIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

const STATUS_OPTIONS = ['All', 'pending', 'confirmed', 'driver_assigned', 'arriving', 'in_ride', 'completed', 'cancelled', 'rejected'];

const statusColors = {
  pending: 'warning',
  confirmed: 'info',
  driver_assigned: 'primary',
  arriving: 'secondary',
  in_ride: 'info',
  completed: 'success',
  cancelled: 'error',
  rejected: 'error'
};

const statusIcons = {
  pending: <PendingIcon />,
  confirmed: <CheckCircleIcon />,
  cancelled: <CancelIcon />,
  completed: <CheckCircleIcon />,
  default: <PendingIcon />
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleString('en-IN', options);
};

export default function Bookings() {
  const { socket } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showNotif, setShowNotif] = useState(false);

  // Fetch bookings
  useEffect(() => {
    setLoading(true);
    api.get('/bookings', { params: status !== 'All' ? { status } : {} })
      .then(res => setBookings(res.data))
      .finally(() => setLoading(false));
  }, [status]);

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const handleNew = (booking) => {
      setBookings(prev => [booking, ...prev.filter(b => b._id !== booking._id)]);
      setNotification('New booking received!');
      setShowNotif(true);
    };
    const handleUpdate = (booking) => {
      setBookings(prev => prev.map(b => b._id === booking._id ? booking : b));
      setNotification('Booking updated');
      setShowNotif(true);
    };
    const handleDelete = ({ id }) => {
      setBookings(prev => prev.filter(b => b._id !== id));
      setNotification('Booking deleted');
      setShowNotif(true);
    };
    socket.on('booking:new', handleNew);
    socket.on('booking:update', handleUpdate);
    socket.on('booking:delete', handleDelete);
    return () => {
      socket.off('booking:new', handleNew);
      socket.off('booking:update', handleUpdate);
      socket.off('booking:delete', handleDelete);
    };
  }, [socket]);

  // Dismiss notification
  useEffect(() => {
    if (!showNotif) return;
    const t = setTimeout(() => setShowNotif(false), 2500);
    return () => clearTimeout(t);
  }, [showNotif]);

  const filtered = useMemo(() => {
    if (status === 'All') return bookings;
    return bookings.filter(b => b.status === status);
  }, [bookings, status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
        Bookings
      </Typography>
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <ButtonGroup variant="contained" color="primary">
          {STATUS_OPTIONS.map(opt => (
            <Button
              key={opt}
              onClick={() => setStatus(opt)}
              sx={{ fontWeight: status === opt ? 700 : 400, bgcolor: status === opt ? 'primary.dark' : 'primary.main' }}
            >
              {opt}
            </Button>
          ))}
        </ButtonGroup>
      </Box>
      <AnimatePresence>
        {showNotif && notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ marginBottom: 16 }}
          >
            <Alert severity="info" variant="filled">{notification}</Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <Paper elevation={4} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Booking ID</TableCell>
                <TableCell>Vehicle Type</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Drop</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fare (₹)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow
                  key={booking._id}
                  sx={{
                    '&:hover': { bgcolor: 'action.hover' },
                    transition: 'background 0.2s',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {booking.bookingId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={<CarIcon />} 
                      label={booking.vehicleType?.toUpperCase() || 'N/A'} 
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="body2" noWrap>
                          {booking.pickup?.address || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocationIcon color="secondary" fontSize="small" />
                      <Box>
                        <Typography variant="body2" noWrap>
                          {booking.drop?.address || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(booking.date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusIcons[booking.status] || statusIcons.default}
                      label={booking.status?.replace('_', ' ').toUpperCase()}
                      color={statusColors[booking.status] || 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      ₹{booking.fare?.total || '0'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <ButtonGroup size="small" variant="outlined">
                      <Tooltip title="View Details">
                        <Button>
                          <MoreVertIcon />
                        </Button>
                      </Tooltip>
                      {booking.status === 'pending' && (
                        <>
                          <Tooltip title="Accept">
                            <Button color="success">
                              <CheckCircleIcon />
                            </Button>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <Button color="error">
                              <CancelIcon />
                            </Button>
                          </Tooltip>
                        </>
                      )}
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </motion.div>
  );
}
