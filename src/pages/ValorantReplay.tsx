// src/pages/ValorantReplay.tsx
import React, { useState } from 'react';
import useReplayStream from '../hooks/useReplayStream';
import { valorantReplayStreamUrl } from '../services/mockApi';
import { Button, Typography, Box } from '@mui/material';
import { useParams } from 'react-router-dom';

export default function ValorantReplay() {
  const { matchId } = useParams();
  const [playing, setPlaying] = useState(false);
  const url = matchId ? valorantReplayStreamUrl(matchId, 1.0) : null;
  const { connected, framesReceived, events } = useReplayStream(playing ? url : null);

  return (
    <Box>
      <Typography variant="h5">Valorant Replay: {matchId}</Typography>
      <Box sx={{ my: 2 }}>
        <Button variant="contained" onClick={() => setPlaying(true)} disabled={playing}>Start</Button>
        <Button variant="outlined" onClick={() => setPlaying(false)} disabled={!playing} sx={{ ml:2 }}>Stop</Button>
      </Box>
      <Typography>Connected: {String(connected)}</Typography>
      <Typography>Frames received: {framesReceived}</Typography>
      <Box sx={{ mt: 2, maxHeight: '400px', overflowY: 'auto', bgcolor: '#f5f5f5', p: 1 }}>
        {events.slice(-20).map((ev, i) => (
          <pre key={i} style={{ fontSize: 12, margin: 0 }}>{JSON.stringify(ev, null, 2)}</pre>
        ))}
      </Box>
    </Box>
  );
}
