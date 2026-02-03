import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, Paper } from '@mui/material';
import ReplayPlayer from '../../components/ReplayPlayer';
import Timeline from '../../components/Timeline';

export function MatchAnalysis() {
  const { matchId } = useParams();

  return (
    <Box>
      <Typography variant="h4">Match Analysis: {matchId}</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <ReplayPlayer matchId={matchId || 'demo'} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Timeline</Typography>
            <Timeline matchId={matchId || 'demo'} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
