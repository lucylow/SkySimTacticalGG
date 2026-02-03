import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent } from '@mui/material';

export function PlayerDevelopment() {
  const { playerId } = useParams();

  return (
    <Box>
      <Typography variant="h4">Player Development: {playerId}</Typography>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6">Performance Overview</Typography>
          <Typography variant="body1">
            Detailed player statistics and development tracking would be displayed here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
