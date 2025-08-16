import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Paper,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  ViewQuilt as ViewQuiltIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const drawerWidth = 240;

const DashboardLayout = ({ userType }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isUser = userType === 'user';
  const isVendor = userType === 'vendor';

  const menuItems = [
    {
      text: 'Bookings',
      icon: <DashboardIcon />,
      path: `/${userType}-dashboard/bookings`,
      roles: ['user', 'vendor'],
    },
    {
      text: 'Invoices',
      icon: <ReceiptIcon />,
      path: `/${userType}-dashboard/invoices`,
      roles: ['user', 'vendor'],
    },
    ...(isVendor
      ? [
          {
            text: 'Drivers',
            icon: <PeopleIcon />,
            path: '/vendor-dashboard/drivers',
            roles: ['vendor'],
          },
          {
            text: 'Vehicles',
            icon: <CarIcon />,
            path: '/vendor-dashboard/vehicles',
            roles: ['vendor'],
          },
          {
            text: 'Open Market',
            icon: <StoreIcon />,
            path: '/vendor-dashboard/open-market',
            roles: ['vendor'],
          },
          {
            text: 'Custom Views',
            icon: <ViewQuiltIcon />,
            path: '/vendor-dashboard/custom-views',
            roles: ['vendor'],
          },
        ]
      : []),
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ 
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      height: '100%',
      color: 'white'
    }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          {user?.name || 'User'}
        </Typography>
        <Chip 
          label={isUser ? 'Customer' : 'Vendor'} 
          size="small"
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 600
          }}
        />
      </Box>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
      <List sx={{ px: 2, py: 1 }}>
        {menuItems
          .filter((item) => item.roles.includes(userType))
          .map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.25)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#2d3748',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: '#667eea'
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              textTransform: 'capitalize',
              color: '#2d3748'
            }}
          >
            {location.pathname.split('/').pop().replace(/-/g, ' ')}
          </Typography>
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
              }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  mt: 1
                }
              }}
            >
              <MenuItem 
                onClick={() => navigate(`/${userType}-dashboard/profile`)}
                sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
              >
                <ListItemIcon>
                  <AccountCircle fontSize="small" sx={{ color: '#667eea' }} />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
              >
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: '#f56565' }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)'
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
