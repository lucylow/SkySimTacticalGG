import React from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function LoadingOverlay() {
  return (
    <Box sx={{ width: '100%', textAlign: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );
}
