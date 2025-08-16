import { createTheme } from '@mui/material/styles';

const palette = {
  50:  '#f4f6fb',
  100: '#e8edf6',
  200: '#ccd9eb',
  300: '#a0bad9',
  400: '#6c94c4',
  500: '#4a77ad',
  600: '#385e91',
  700: '#325280',
  800: '#294163',
  900: '#273953',
  950: '#1a2437',
};

const theme = createTheme({
  palette: {
    primary: {
      main: palette[500],
      light: palette[300],
      dark: palette[700],
      contrastText: '#fff',
    },
    background: {
      default: palette[50],
      paper: palette[100],
    },
    secondary: {
      main: palette[400],
      dark: palette[950],
      contrastText: '#fff',
    },
    text: {
      primary: palette[900],
      secondary: palette[700],
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    h2: {
      fontWeight: 700,
      color: palette[700],
    },
  },
});

export default theme;
