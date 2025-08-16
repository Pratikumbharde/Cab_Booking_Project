import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Typography, Alert, CircularProgress, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export default function Vehicles() {
  const { socket, user, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: '', plate: '', model: '', insurance: '', condition: '', available: true });
  const [editing, setEditing] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch vehicles only after user is authenticated
  useEffect(() => {
    if (authLoading || !user) return;
    
    setLoading(true);
    api.get('/vehicles')
      .then(res => {
        console.log('Vehicles API response:', res.data);
        setVehicles(res.data);
      })
      .catch(err => {
        console.error('Failed to fetch vehicles:', err);
        setNotification('Failed to load vehicles');
        setShowNotif(true);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const handleNew = (vehicle) => {
      setVehicles(prev => [vehicle, ...prev.filter(v => v._id !== vehicle._id)]);
      setNotification('New vehicle added!');
      setShowNotif(true);
    };
    const handleUpdate = (vehicle) => {
      setVehicles(prev => prev.map(v => v._id === vehicle._id ? vehicle : v));
      setNotification('Vehicle updated');
      setShowNotif(true);
    };
    const handleDelete = ({ id }) => {
      setVehicles(prev => prev.filter(v => v._id !== id));
      setNotification('Vehicle deleted');
      setShowNotif(true);
    };
    socket.on('vehicle:new', handleNew);
    socket.on('vehicle:update', handleUpdate);
    socket.on('vehicle:delete', handleDelete);
    return () => {
      socket.off('vehicle:new', handleNew);
      socket.off('vehicle:update', handleUpdate);
      socket.off('vehicle:delete', handleDelete);
    };
  }, [socket]);

  // Dismiss notification
  useEffect(() => {
    if (!showNotif) return;
    const t = setTimeout(() => setShowNotif(false), 2500);
    return () => clearTimeout(t);
  }, [showNotif]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      await api.put(`/vehicles/${editing._id}`, form);
      setEditing(null);
    } else {
      await api.post('/vehicles', form);
    }
    setForm({ type: '', plate: '', model: '', insurance: '', condition: '', available: true });
    setOpenDialog(false);
  }

  function handleEdit(vehicle) {
    setEditing(vehicle);
    setForm({
      type: vehicle.type,
      plate: vehicle.plate,
      model: vehicle.model,
      insurance: vehicle.insurance,
      condition: vehicle.condition,
      available: vehicle.available,
    });
    setOpenDialog(true);
  }

  async function handleDelete(id) {
    await api.delete(`/vehicles/${id}`);
  }

  function handleAdd() {
    setEditing(null);
    setForm({ type: '', plate: '', model: '', insurance: '', condition: '', available: true });
    setOpenDialog(true);
  }

  const buttonMotion = {
    whileHover: { scale: 1.07, boxShadow: '0 2px 12px 0 #1976d233' },
    whileTap: { scale: 0.95 },
  };
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
        Vehicles
      </Typography>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <motion.div {...buttonMotion} style={{ display: 'inline-block' }}>
          <Button variant="contained" color="primary" onClick={handleAdd} sx={{ borderRadius: 2 }}>
            Add Vehicle
          </Button>
        </motion.div>
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
                <TableCell>Type</TableCell>
                <TableCell>Plate</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Insurance</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Available</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map(vehicle => (
                <motion.tr key={vehicle._id} {...rowMotion} style={{ cursor: 'pointer' }}>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.insurance}</TableCell>
                  <TableCell>{vehicle.condition}</TableCell>
                  <TableCell>{vehicle.available ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <motion.div {...buttonMotion} style={{ display: 'inline-block', marginRight: 8 }}>
                      <Button size="small" color="primary" variant="outlined" onClick={() => handleEdit(vehicle)}>
                        Edit
                      </Button>
                    </motion.div>
                    <motion.div {...buttonMotion} style={{ display: 'inline-block' }}>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(vehicle._id)}>
                        Delete
                      </Button>
                    </motion.div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }} onSubmit={handleSubmit}>
            <TextField label="Type" name="type" value={form.type} onChange={handleChange} required fullWidth />
            <TextField label="Plate" name="plate" value={form.plate} onChange={handleChange} required fullWidth />
            <TextField label="Model" name="model" value={form.model} onChange={handleChange} required fullWidth />
            <TextField label="Insurance" name="insurance" value={form.insurance} onChange={handleChange} required fullWidth />
            <TextField label="Condition" name="condition" value={form.condition} onChange={handleChange} required fullWidth />
            <FormControlLabel control={<Checkbox name="available" checked={form.available} onChange={handleChange} />} label="Available" />
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
