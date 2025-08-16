import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, TextField, Button, MenuItem, Alert, IconButton, Tabs, Tab, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress, Container, Grid, Card, CardContent, Avatar, Divider, List, ListItem, ListItemButton, ListItemText
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  DirectionsCar as CarIcon,
  Map as MapIcon,
  Close as CloseIcon,
  MyLocation as MyLocationIcon
} from '@mui/icons-material';
import { bookRide, getRideHistory } from './services/ride';
import { getAvailableVehicles } from './services/vehicle';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from './AuthContext';

// Default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMap = ({ position, onPositionChange, mapCenter }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      if (position) map.flyTo([position.lat, position.lng], 15);
      else map.setView(mapCenter, 5);
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [map, position, mapCenter]);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    }
  });

  return position ? <Marker position={position} /> : null;
};

const BookRide = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [pickup, setPickup] = useState({ address: '', coordinates: null });
  const [drop, setDrop] = useState({ address: '', coordinates: null });
  const [vehicle, setVehicle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const { user } = useAuth();
  const [mapCenter] = useState([19.0728, 72.8826]); // Kurla East, Mumbai coordinates
  const [mapZoom] = useState(15); // Zoom level for Kurla East area view
  const [activeInput, setActiveInput] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef(null);

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const availableVehicles = await getAvailableVehicles();
      setVehicles(availableVehicles);
    } catch {
      setError('Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user._id || user.id)) fetchVehicles();
  }, [user]);

  // Fetch bookings
  const fetchPastBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const bookings = await getRideHistory(user._id || user.id);
      setPastBookings(bookings || []);
    } catch {
      setError('Failed to load past bookings');
      setPastBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };
  useEffect(() => {
    if (activeTab === 1) fetchPastBookings();
  }, [activeTab, success]);

  // Search API
  const handleSearch = async (query) => {
    if (!query.trim()) return setSuggestions([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (s) => {
    const loc = {
      address: s.display_name,
      coordinates: [parseFloat(s.lat), parseFloat(s.lon)] // lat, lng order
    };
    if (activeInput === 'pickup') setPickup(loc);
    else setDrop(loc);
    setSuggestions([]);
    setSearchQuery('');
    setShowMap(false);
  };

  const handleMapClick = (latlng) => {
    const loc = {
      address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
      coordinates: [latlng.lat, latlng.lng]
    };
    if (activeInput === 'pickup') setPickup(loc);
    else setDrop(loc);
    setShowMap(false);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setPickup({ address: 'My Current Location', coordinates: [latitude, longitude] });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickup.coordinates || !drop.coordinates) return setError('Select pickup & drop locations');
    if (!vehicle) return setError('Select a vehicle');

    setLoading(true);
    setError('');
    try {
      const bookingData = {
        pickup,
        drop,
        vehicleType: vehicle,
        scheduledTime: date && time ? `${date}T${time}` : null,
        status: 'pending'
      };
      await bookRide(bookingData, user._id || user.id);
      setSuccess('Ride booked successfully!');
      setPickup({ address: '', coordinates: null });
      setDrop({ address: '', coordinates: null });
      setVehicle('');
      setDate('');
      setTime('');
      setActiveTab(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book ride');
    } finally {
      setLoading(false);
    }
  };

  const renderBookingForm = () => (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box textAlign="center" mb={3}>
                <Avatar sx={{ bgcolor: '#667eea', mx: 'auto' }}><CarIcon /></Avatar>
                <Typography variant="h5">Book Your Ride</Typography>
              </Box>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField type="date" label="Date (Optional)" value={date} onChange={(e)=>setDate(e.target.value)} fullWidth InputLabelProps={{shrink:true}} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField type="time" label="Time (Optional)" value={time} onChange={(e)=>setTime(e.target.value)} fullWidth InputLabelProps={{shrink:true}} disabled={!date}/>
                  </Grid>
                </Grid>

                <TextField label="Pickup Location" value={pickup.address} onClick={()=>{setActiveInput('pickup'); setShowMap(true)}} fullWidth margin="normal" InputProps={{startAdornment:<LocationIcon />}} />
                <TextField label="Drop Location" value={drop.address} onClick={()=>{setActiveInput('drop'); setShowMap(true)}} fullWidth margin="normal" InputProps={{startAdornment:<LocationIcon />}} />

                {suggestions.length>0 && (
                  <List sx={{border:'1px solid #ccc', borderRadius:1, maxHeight:200, overflow:'auto'}}>
                    {suggestions.map((s)=>(
                      <ListItem key={s.place_id} disablePadding>
                        <ListItemButton onClick={()=>handleSuggestionClick(s)}>
                          <ListItemText primary={s.display_name} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}

                <TextField select label="Select Vehicle" value={vehicle} onChange={(e)=>setVehicle(e.target.value)} fullWidth margin="normal">
                  {vehicles.map((v)=>(<MenuItem key={v._id} value={v._id}>{v.type} - {v.model}</MenuItem>))}
                </TextField>

                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button onClick={handleCurrentLocation} startIcon={<MyLocationIcon />}>Use My Location</Button>
                  <Button type="submit" variant="contained" disabled={loading}>{loading? 'Booking...':'Book Ride'}</Button>
                </Box>

                {success && <Alert severity="success" sx={{mt:2}}>{success}</Alert>}
                {error && <Alert severity="error" sx={{mt:2}}>{error}</Alert>}
              </form>

              {showMap && (
                <Box mt={3}>
                  <MapContainer 
                    center={mapCenter} 
                    zoom={mapZoom}
                    style={{
                      height: '500px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    zoomControl={true}
                    minZoom={13}
                    maxBounds={[
                      [19.0528, 72.8426], // Southwest coordinates of Kurla East area
                      [19.0928, 72.9226]  // Northeast coordinates of Kurla East area
                    ]}
                  >
                    <TileLayer 
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <LocationMap 
                      position={activeInput==='pickup'? 
                        (pickup.coordinates ? {lat: pickup.coordinates[0], lng: pickup.coordinates[1]} : null) : 
                        (drop.coordinates ? {lat: drop.coordinates[0], lng: drop.coordinates[1]} : null)}
                      onPositionChange={handleMapClick}
                      mapCenter={mapCenter}
                    />
                  </MapContainer>
                  <Button startIcon={<CloseIcon />} onClick={()=>setShowMap(false)} sx={{mt:1}}>Close Map</Button>
                </Box>
              )}

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Quick Tips</Typography>
              <Typography variant="body2">Click on map to set precise locations.</Typography>
              <Typography variant="body2">Schedule rides for later or book instantly.</Typography>
              <Typography variant="body2">Choose from available vehicles.</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );

  const renderPastBookings = () => (
    <>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">My Bookings</Typography>
        <Button variant="outlined" onClick={fetchPastBookings} startIcon={<RefreshIcon />} disabled={loadingBookings}>Refresh</Button>
      </Box>
      {loadingBookings? <CircularProgress/> : pastBookings.length===0? <Typography>No bookings yet.</Typography> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Vehicle</TableCell><TableCell>Pickup</TableCell><TableCell>Drop</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {pastBookings.map((b)=>(
                <TableRow key={b._id}>
                  <TableCell>{b.bookingId}</TableCell>
                  <TableCell>{b.vehicleType}</TableCell>
                  <TableCell>{b.pickup?.address}</TableCell>
                  <TableCell>{b.drop?.address}</TableCell>
                  <TableCell><Chip label={b.status} color={b.status==='completed'?'success':b.status==='cancelled'?'error':'primary'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );

  return (
    <Box sx={{minHeight:'100vh', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py:3}}>
      <Container maxWidth="lg">
        <Paper sx={{borderRadius:3, overflow:'hidden'}}>
          <Box sx={{background:'linear-gradient(135deg,#667eea,#764ba2)', color:'white', p:3}}>
            <Typography variant="h4">Ride Booking</Typography>
            <Typography>Book your ride or manage your bookings</Typography>
          </Box>

          <Box p={3}>
            <Tabs value={activeTab} onChange={(e,v)=>setActiveTab(v)} variant="fullWidth">
              <Tab label="Book a Ride" icon={<CarIcon/>} iconPosition="start" />
              <Tab label="My Bookings" icon={<ScheduleIcon/>} iconPosition="start" />
            </Tabs>

            {activeTab===0? renderBookingForm() : renderPastBookings()}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookRide;
