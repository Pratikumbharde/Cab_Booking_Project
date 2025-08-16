import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Alert, CircularProgress, Box
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export default function OpenMarket() {
  const { socket } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showNotif, setShowNotif] = useState(false);

  // Fetch open market bookings
  useEffect(() => {
    setLoading(true);
    api.get('/open-market')
      .then(res => setBookings(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const handleOpenMarket = (booking) => {
      setBookings(prev => [booking, ...prev.filter(b => b._id !== booking._id)]);
      setNotification('New open market booking!');
      setShowNotif(true);
    };
    socket.on('openMarket:new', handleOpenMarket);
    return () => {
      socket.off('openMarket:new', handleOpenMarket);
    };
  }, [socket]);

  // Dismiss notification
  useEffect(() => {
    if (!showNotif) return;
    const t = setTimeout(() => setShowNotif(false), 2500);
    return () => clearTimeout(t);
  }, [showNotif]);

  const rowMotion = {
    whileHover: { scale: 1.01, backgroundColor: '#e3f2fd' },
  };
  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -30, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
        Open Market Bookings
      </Typography>
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>ID</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Guest</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Drop</TableCell>
                <TableCell>Expires At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map(b => (
                <motion.tr key={b._id} {...rowMotion} style={{ cursor: 'pointer' }}>
                  <TableCell>{b.bookingId}</TableCell>
                  <TableCell>{b.company}</TableCell>
                  <TableCell>{b.guest?.name}</TableCell>
                  <TableCell>{b.status}</TableCell>
                  <TableCell>{b.pickupLocation} <br/> {b.pickupTime && new Date(b.pickupTime).toLocaleString()}</TableCell>
                  <TableCell>{b.dropLocation} <br/> {b.dropTime && new Date(b.dropTime).toLocaleString()}</TableCell>
                  <TableCell>{b.openMarketInfo?.expiresAt ? new Date(b.openMarketInfo.expiresAt).toLocaleString() : '-'}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </motion.div>
  );
}
