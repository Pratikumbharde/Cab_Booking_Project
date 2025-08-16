import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Box, 
  Paper, 
  Card, 
  CardContent, 
  Chip, 
  CircularProgress, 
  Alert,
  Grid,
  Avatar,
  Divider,
  IconButton,
  Container
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from './AuthContext';
import { getRideHistory } from './services/ride';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUpcomingBookings = async () => {
      if (!user || (!user._id && !user.id)) return;
      
      try {
        setLoading(true);
        const bookings = await getRideHistory(user._id || user.id);
        
        // Filter for upcoming bookings (pending, confirmed, or in_progress)
        const upcoming = bookings.filter(booking => 
          ['pending', 'confirmed', 'in_progress'].includes(booking.status)
        );
        
        setUpcomingBookings(upcoming);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load your bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingBookings();
  }, [user]);

  const handleBookRide = () => {
    navigate('/book-ride');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 3
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar 
                sx={{ 
                  bgcolor: '#667eea', 
                  width: 56, 
                  height: 56,
                  fontSize: '1.5rem'
                }}
              >
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#2d3748' }}>
                  Welcome, {user?.name || 'User'}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ready for your next journey?
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleLogout}
              sx={{ 
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
              }}
            >
              <LogoutIcon sx={{ color: '#667eea' }} />
            </IconButton>
          </Box>
        </Paper>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={handleBookRide}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Book a New Ride
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Quick and easy booking in just a few taps
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate('/ride-history')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <HistoryIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Ride History
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  View all your past and completed rides
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Upcoming Bookings Section */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <ScheduleIcon sx={{ color: '#667eea', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2d3748' }}>
              Your Upcoming Rides
            </Typography>
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          ) : upcomingBookings.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CarIcon sx={{ fontSize: 64, color: '#cbd5e0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No upcoming rides
              </Typography>
              <Typography color="text.secondary">
                Book your first ride using the button above!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {upcomingBookings.map((booking) => (
                <Grid item xs={12} key={booking._id}>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      '&:hover': { 
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                          {booking.bookingId}
                        </Typography>
                        <Chip 
                          label={booking.status.toUpperCase()} 
                          color={getStatusColor(booking.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <LocationIcon sx={{ color: '#48bb78', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>From:</strong> {booking.pickup?.address || 'Pickup location'}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <LocationIcon sx={{ color: '#ed64a6', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>To:</strong> {booking.drop?.address || 'Drop location'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <CarIcon sx={{ color: '#667eea', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Vehicle:</strong> {booking.vehicleType}
                            </Typography>
                          </Box>
                          {booking.fare && (
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <PaymentIcon sx={{ color: '#38b2ac', fontSize: 18 }} />
                              <Typography variant="body2" color="text.secondary">
                                <strong>Fare:</strong> ₹{booking.fare.total}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                      </Grid>
                      
                      {booking.scheduledTime && (
                        <Box display="flex" alignItems="center" gap={1} mt={2} pt={2} sx={{ borderTop: '1px solid #e2e8f0' }}>
                          <ScheduleIcon sx={{ color: '#f6ad55', fontSize: 18 }} />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Scheduled:</strong> {new Date(booking.scheduledTime).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default UserDashboard;
