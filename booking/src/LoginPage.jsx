import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/bookings', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary.main" fontWeight={700} align="center">
            Vendor Login
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              variant="outlined"
              color="primary"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              variant="outlined"
              color="primary"
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              color="primary"
              disabled={loading}
              sx={{ mt: 1, fontWeight: 600, borderRadius: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
}
