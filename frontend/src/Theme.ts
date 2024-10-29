import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E0C2FF', // Very light purple
      light: '#F2E4FF',
      dark: '#C7A3E8',
    },
    secondary: {
      main: '#F5F5F5', // Light grey with slight purple tint
      light: '#FFFFFF',
      dark: '#E0E0E0',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#F2E4FF', // Very light purple for primary text
      secondary: '#0C2FF', // Slightly darker but still light purple for secondary text
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(224, 194, 255, 0.08)', // Light purple with low opacity for hover
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(224, 194, 255, 0.16)', // Light purple with higher opacity for selected state
            '&:hover': {
              backgroundColor: 'rgba(224, 194, 255, 0.24)',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(224, 194, 255, 0.08)',
          },
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
    },
    // Ensure all text components have good contrast
    h1: {
      color: '#F2E4FF',
    },
    h2: {
      color: '#F2E4FF',
    },
    h3: {
      color: '#F2E4FF',
    },
    h4: {
      color: '#F2E4FF',
    },
    h5: {
      color: '#F2E4FF',
    },
    h6: {
      color: '#F2E4FF',
    },
    body1: {
      color: '#F2E4FF',
    },
    body2: {
      color: '#E0C2FF',
    },
  },
});