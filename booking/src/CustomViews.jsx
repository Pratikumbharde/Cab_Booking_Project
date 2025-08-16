import { useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './AuthContext';
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Typography, Alert, CircularProgress, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomViews() {
  const { socket } = useAuth();
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', resource: 'bookings', filters: '', columns: '' });
  const [editing, setEditing] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch custom views
  useEffect(() => {
    setLoading(true);
    api.get('/custom-views')
      .then(res => setViews(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Live updates
  useEffect(() => {
    if (!socket) return;
    const handleNew = (view) => {
      setViews(prev => [view, ...prev.filter(v => v._id !== view._id)]);
      setNotification('Custom view created!');
      setShowNotif(true);
    };
    const handleUpdate = (view) => {
      setViews(prev => prev.map(v => v._id === view._id ? view : v));
      setNotification('Custom view updated');
      setShowNotif(true);
    };
    const handleDelete = ({ id }) => {
      setViews(prev => prev.filter(v => v._id !== id));
      setNotification('Custom view deleted');
      setShowNotif(true);
    };
    socket.on('customView:new', handleNew);
    socket.on('customView:update', handleUpdate);
    socket.on('customView:delete', handleDelete);
    return () => {
      socket.off('customView:new', handleNew);
      socket.off('customView:update', handleUpdate);
      socket.off('customView:delete', handleDelete);
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
      await api.put(`/custom-views/${editing._id}`, form);
      setEditing(null);
    } else {
      await api.post('/custom-views', form);
    }
    setForm({ name: '', resource: 'bookings', filters: '', columns: '' });
    setOpenDialog(false);
  }

  function handleEdit(view) {
    setEditing(view);
    setForm({
      name: view.name,
      resource: view.resource,
      filters: view.filters,
      columns: view.columns,
    });
    setOpenDialog(true);
  }

  async function handleDelete(id) {
    await api.delete(`/custom-views/${id}`);
  }

  function handleAdd() {
    setEditing(null);
    setForm({ name: '', resource: 'bookings', filters: '', columns: '' });
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
        Custom Views
      </Typography>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <motion.div {...buttonMotion} style={{ display: 'inline-block' }}>
          <Button variant="contained" color="primary" onClick={handleAdd} sx={{ borderRadius: 2 }}>
            Add Custom View
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
                <TableCell>Name</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Filters</TableCell>
                <TableCell>Columns</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {views.map(view => (
                <motion.tr key={view._id} {...rowMotion} style={{ cursor: 'pointer' }}>
                  <TableCell>{view.name}</TableCell>
                  <TableCell>{view.resource}</TableCell>
                  <TableCell>{view.filters}</TableCell>
                  <TableCell>{view.columns}</TableCell>
                  <TableCell align="right">
                    <motion.div {...buttonMotion} style={{ display: 'inline-block', marginRight: 8 }}>
                      <Button size="small" color="primary" variant="outlined" onClick={() => handleEdit(view)}>
                        Edit
                      </Button>
                    </motion.div>
                    <motion.div {...buttonMotion} style={{ display: 'inline-block' }}>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(view._id)}>
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
        <DialogTitle>{editing ? 'Edit Custom View' : 'Add Custom View'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }} onSubmit={handleSubmit}>
            <TextField label="View Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
            <FormControl fullWidth required>
              <InputLabel id="resource-label">Resource</InputLabel>
              <Select labelId="resource-label" name="resource" value={form.resource} label="Resource" onChange={handleChange}>
                <MenuItem value="bookings">Bookings</MenuItem>
                <MenuItem value="drivers">Drivers</MenuItem>
                <MenuItem value="vehicles">Vehicles</MenuItem>
                <MenuItem value="invoices">Invoices</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Filters (JSON)" name="filters" value={form.filters} onChange={handleChange} fullWidth />
            <TextField label="Columns (comma-separated)" name="columns" value={form.columns} onChange={handleChange} fullWidth />
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
