import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import DashboardLayout from './DashboardLayout';
import DriverDashboard from './DriverDashboard';
import UserDashboard from './UserDashboard';
import BookRide from './BookRide';
import Bookings from './Bookings';
import Drivers from './Drivers';
import Vehicles from './Vehicles';
import Invoices from './Invoices';
import OpenMarket from './OpenMarket';
import CustomViews from './CustomViews';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected User Dashboard (simple) */}
            <Route
              path="/user-dashboard"
              element={
                <ProtectedRoute requiredRole="customer">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book-ride"
              element={
                <ProtectedRoute requiredRole="customer">
                  <BookRide />
                </ProtectedRoute>
              }
            />

            {/* Protected Driver Routes */}
            <Route
              path="/driver-dashboard"
              element={
                <ProtectedRoute requiredRole="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Vendor Routes */}
            <Route
              path="/vendor-dashboard"
              element={
                <ProtectedRoute requiredRole="vendor">
                  <DashboardLayout userType="vendor" />
                </ProtectedRoute>
              }
            >
              <Route index element={<Bookings />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="open-market" element={<OpenMarket />} />
              <Route path="custom-views" element={<CustomViews />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
