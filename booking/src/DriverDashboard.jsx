import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem as MenuItemComponent,
  Container,
  Avatar,
  Divider
} from '@mui/material';
import {
  DirectionsCar,
  Assignment,
  CheckCircle,
  Schedule,
  AccountCircle,
  Logout,
  Refresh
} from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { api } from './api';

const DriverDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user && user.role === 'driver') {
      fetchDriverData();
    }
  }, [user]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, profileRes] = await Promise.all([
        api.get('/driver/bookings'),
        api.get('/driver/profile')
      ]);
      
      setBookings(bookingsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching driver data:', error);
      setError('Failed to load driver data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      setUpdating(true);
      await api.patch(`/driver/bookings/${selectedBooking._id}/status`, {
        status: newStatus
      });

      setSuccess('Booking status updated successfully');
      setSelectedBooking(null);
      setNewStatus('');
      fetchDriverData(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'default',
      'confirmed': 'info',
      'driver_assigned': 'primary',
      'arriving': 'warning',
      'in_ride': 'secondary',
      'completed': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      'confirmed': ['driver_assigned'],
      'driver_assigned': ['arriving'],
      'arriving': ['in_ride'],
      'in_ride': ['completed']
    };
    return statusFlow[currentStatus] || [];
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 0
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" alignItems="center" justifyContent="space-between" py={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                <DirectionsCar />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Driver Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Welcome back, {user?.name}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleMenuClick}
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                {user?.name?.charAt(0) || 'D'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  mt: 1
                }
              }}
            >
              <MenuItemComponent 
                onClick={handleLogout}
                sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
              >
                <Logout fontSize="small" sx={{ mr: 1, color: '#f56565' }} />
                Logout
              </MenuItemComponent>
            </Menu>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {success}
          </Alert>
        )}

        {/* Stats Cards */}
        {profile && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center">
                    <Assignment sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Total Bookings
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {profile.stats.totalBookings}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                  color: 'white',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center">
                    <CheckCircle sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Completed
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {profile.stats.completedBookings}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)',
                  color: 'white',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Today's Rides
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {profile.stats.todayBookings}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ed64a6 0%, #d53f8c 100%)',
                  color: 'white',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center">
                    <DirectionsCar sx={{ fontSize: 40, mr: 2, opacity: 0.9 }} />
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        Completion Rate
                      </Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {profile.stats.completionRate}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Bookings Table */}
        <Card 
          sx={{ 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
                My Bookings
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={fetchDriverData}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                  }
                }}
              >
                Refresh
              </Button>
            </Box>

            <TableContainer 
              component={Paper} 
              sx={{ 
                borderRadius: 2, 
                boxShadow: 'none',
                border: '1px solid #e2e8f0'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f7fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Booking ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Pickup</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Drop</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Fare</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#2d3748' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.bookingId}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{booking.user?.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {booking.user?.phone}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{booking.pickup?.address}</TableCell>
                      <TableCell>{booking.drop?.address}</TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#2d3748' }}>
                          ₹{booking.payment?.amount || booking.fare?.total || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {getNextStatuses(booking.status).length > 0 && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setSelectedBooking(booking)}
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: 2,
                              fontSize: '0.75rem',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                              }
                            }}
                          >
                            Update Status
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {bookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary">
                          No bookings assigned yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>

      {/* Status Update Dialog */}
      <Dialog 
        open={Boolean(selectedBooking)} 
        onClose={() => setSelectedBooking(null)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#2d3748' }}>
          Update Booking Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Booking: {selectedBooking?.bookingId}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current Status: <Chip label={selectedBooking?.status} size="small" />
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              label="New Status"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            >
              {getNextStatuses(selectedBooking?.status).map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace('_', ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setSelectedBooking(null)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusUpdate}
            variant="contained"
            disabled={!newStatus || updating}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
              }
            }}
          >
            {updating ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard;
