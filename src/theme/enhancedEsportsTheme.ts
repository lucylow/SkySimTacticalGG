import { createTheme } from '@mui/material/styles';

const enhancedEsportsTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00FFFF' // electric cyan
    },
    secondary: {
      main: '#003366' // deep cyber blue
    },
    background: {
      default: '#0b1220',
      paper: '#0f1724'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '0.5px' },
    button: { textTransform: 'none' }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true }
    }
  }
});

export default enhancedEsportsTheme;
