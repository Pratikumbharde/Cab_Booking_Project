import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import { 
  DirectionsCar as CarIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loading: authLoading } = useAuth();

  // Set initial tab based on URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type === 'vendor') {
      setTabValue(1);
    }
  }, [location]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const loginSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      setError('');

      const result = await login(values.email, values.password);
      
      if (result.success) {
        // Redirect based on user role
        const intendedPath = location.state?.from?.pathname;
        if (intendedPath && intendedPath !== '/login') {
          navigate(intendedPath, { replace: true });
        } else if (result.user.role === 'vendor') {
          navigate('/vendor-dashboard', { replace: true });
        } else if (result.user.role === 'driver') {
          navigate('/driver-dashboard', { replace: true });
        } else {
          navigate('/user-dashboard', { replace: true });
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
  });

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const userType = tabValue === 1 ? 'Vendor' : tabValue === 2 ? 'Driver' : 'Customer';
  const getTabIcon = (index) => {
    switch(index) {
      case 0: return <PersonIcon />;
      case 1: return <BusinessIcon />;
      case 2: return <CarIcon />;
      default: return <PersonIcon />;
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2,
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              fontSize: '2rem'
            }}
          >
            🚗
          </Avatar>
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            sx={{ 
              color: 'white', 
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            RideBook
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              mb: 3
            }}
          >
            Your Premium Ride Booking Platform
          </Typography>
        </Box>

        <Paper 
          elevation={24} 
          sx={{ 
            p: 4, 
            borderRadius: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              mb: 4,
              '& .MuiTab-root': {
                minHeight: 60,
                borderRadius: 2,
                mx: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.1)',
                }
              },
              '& .Mui-selected': {
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                color: 'white !important',
                borderRadius: 2,
              }
            }}
            aria-label="login tabs"
          >
            <Tab 
              icon={<PersonIcon />} 
              label="Customer" 
              iconPosition="start"
              sx={{ fontWeight: 'bold' }}
            />
            <Tab 
              icon={<BusinessIcon />} 
              label="Vendor" 
              iconPosition="start"
              sx={{ fontWeight: 'bold' }}
            />
            <Tab 
              icon={<CarIcon />} 
              label="Driver" 
              iconPosition="start"
              sx={{ fontWeight: 'bold' }}
            />
          </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

          <Box role="tabpanel">
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              align="center"
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3
              }}
            >
              {formik.isSubmitting ? 'Signing in...' : `Welcome ${userType}!`}
            </Typography>
            
            <Box component="form" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={loading}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
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
              />
              <TextField
                fullWidth
                margin="normal"
                id="password"
                name="password"
                label="Password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={loading}
                InputProps={{
                  startAdornment: <LockIcon sx={{ color: 'action.active', mr: 1 }} />,
                }}
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
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading || !formik.isValid || formik.isSubmitting}
                sx={{ 
                  mt: 4, 
                  mb: 3,
                  py: 1.5,
                  borderRadius: 3,
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                    boxShadow: '0 6px 10px 2px rgba(102, 126, 234, .3)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  `Sign In as ${userType}`
                )}
              </Button>
            </Box>
            
            <Divider sx={{ my: 3 }}>
              <Chip 
                label="Demo Credentials" 
                sx={{ 
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  fontWeight: 'bold'
                }} 
              />
            </Divider>
            
            {/* Demo Credentials Cards */}
            <Card 
              sx={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  {getTabIcon(tabValue)}
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
                    {userType} Demo Account
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.7)', 
                    borderRadius: 2,
                    fontFamily: 'monospace'
                  }}
                >
                  {tabValue === 0 && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Email:</strong> customer@gmail.com
                      </Typography>
                      <Typography variant="body2">
                        <strong>Password:</strong> password123
                      </Typography>
                    </>
                  )}
                  {tabValue === 1 && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Email:</strong> vendor@gmail.com
                      </Typography>
                      <Typography variant="body2">
                        <strong>Password:</strong> password123
                      </Typography>
                    </>
                  )}
                  {tabValue === 2 && (
                    <>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Email:</strong> RahulSharma@gmail.com
                      </Typography>
                      <Typography variant="body2">
                        <strong>Password:</strong> Password@123
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
