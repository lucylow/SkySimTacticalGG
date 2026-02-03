import React from 'react';
import { Box, Button, Typography } from '@mui/material';

declare global {
  interface Window {
    reportError?: (error: any, info: any) => void;
  }
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error('Uncaught error:', error, info);
    // Here you could send error to a service like Sentry
    if (window.reportError) {
      window.reportError(error, info);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          {this.props.fallback || <Typography>Something went wrong.</Typography>}
          <Button sx={{ mt: 2 }} onClick={() => this.setState({ hasError: false })} variant="contained">Try again</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
