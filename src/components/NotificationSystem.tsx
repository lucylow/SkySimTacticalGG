import React from 'react';
import { Snackbar, Alert } from '@mui/material';

export default function NotificationSystem() {
  // For the demo this is a no-op stub. Replace with global store or context.
  const [open] = React.useState(false);
  return (
    <Snackbar open={open} autoHideDuration={3000}>
      <Alert severity="info">This is a sample notification</Alert>
    </Snackbar>
  );
}
