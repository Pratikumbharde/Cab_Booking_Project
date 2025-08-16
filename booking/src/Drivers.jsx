import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, ButtonGroup, Typography, Alert, CircularProgress, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export default function Drivers() {
  const { socket, user, loading: authLoading } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', licenseNumber: '', phone: '', aadhar: '', pan: '' });
  const [editing, setEditing] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch drivers only after user is authenticated
  useEffect(() => {
    if (authLoading || !user) return;
    
    setLoading(true);
    api.get('/drivers')
      .then(res => setDrivers(res.data))
      .catch(err => {
        console.error('Failed to fetch drivers:', err);
        setNotification('Failed to load drivers');
        setShowNotif(true);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const handleNew = (driver) => {
      setDrivers(prev => [driver, ...prev.filter(d => d._id !== driver._id)]);
      setNotification('New driver added!');
      setShowNotif(true);
    };
    const handleUpdate = (driver) => {
      setDrivers(prev => prev.map(d => d._id === driver._id ? driver : d));
      setNotification('Driver updated');
      setShowNotif(true);
    };
    const handleDelete = ({ id }) => {
      setDrivers(prev => prev.filter(d => d._id !== id));
      setNotification('Driver deleted');
      setShowNotif(true);
    };
    socket.on('driver:new', handleNew);
    socket.on('driver:update', handleUpdate);
    socket.on('driver:delete', handleDelete);
    return () => {
      socket.off('driver:new', handleNew);
      socket.off('driver:update', handleUpdate);
      socket.off('driver:delete', handleDelete);
    };
  }, [socket]);

  // Dismiss notification
  useEffect(() => {
    if (!showNotif) return;
    const t = setTimeout(() => setShowNotif(false), 2500);
    return () => clearTimeout(t);
  }, [showNotif]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await api.put(`/drivers/${editing._id}`, form);
      setEditing(null);
    } else {
      await api.post('/drivers', form);
    }
    setForm({ name: '', licenseNumber: '', phone: '', aadhar: '', pan: '' });
    setOpenDialog(false);
  }

  function handleEdit(driver) {
    setEditing(driver);
    setForm({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      phone: driver.phone,
      aadhar: driver.aadhar,
      pan: driver.pan,
    });
    setOpenDialog(true);
  }

  async function handleDelete(id) {
    await api.delete(`/drivers/${id}`);
  }

  function handleAdd() {
    setEditing(null);
    setForm({ name: '', licenseNumber: '', phone: '', aadhar: '', pan: '' });
    setOpenDialog(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Typography variant="h4" fontWeight={700} color="primary.main" mb={3}>
        Drivers
      </Typography>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={handleAdd} sx={{ borderRadius: 2 }}>
          Add Driver
        </Button>
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Name</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Aadhar</TableCell>
                <TableCell>PAN</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map(driver => (
                <TableRow key={driver._id} sx={{ '&:hover': { bgcolor: 'primary.50' }, transition: 'background 0.2s' }}>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell>{driver.licenseNumber}</TableCell>
                  <TableCell>{driver.phone}</TableCell>
                  <TableCell>{driver.aadhar}</TableCell>
                  <TableCell>{driver.pan}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="primary" variant="outlined" sx={{ mr: 1 }} onClick={() => handleEdit(driver)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(driver._id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editing ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }} onSubmit={handleSubmit}>
            <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
            <TextField label="License Number" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required fullWidth />
            <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} required fullWidth />
            <TextField label="Aadhar" name="aadhar" value={form.aadhar} onChange={handleChange} required fullWidth />
            <TextField label="PAN" name="pan" value={form.pan} onChange={handleChange} required fullWidth />
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} color="secondary">Cancel</Button>
              <Button type="submit" variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
