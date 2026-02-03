import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import useAgentStream from '../hooks/useAgentStream';
import { startAgentStreamUrl } from '../services/api_new';

export default function ReplayPlayer({ matchId }: { matchId: string }) {
  const url = startAgentStreamUrl(`replay ${matchId}`);
  const { events } = useAgentStream(url);

  // For demo: find 'token' events that we treat as frame updates
  const frames = events.filter(e => e.type === 'token');

  return (
    <Box>
      <Typography variant="subtitle1">Replay Player</Typography>
      <Box sx={{ height: 360, bgcolor: 'background.paper', mt: 2, p: 2, borderRadius: 1 }}>
        <Typography variant="body2">Frames received: {frames.length}</Typography>
        <Box sx={{ mt: 2 }}>
          {frames.slice(-10).map((f, i) => (
            <Typography key={i} variant="caption">{JSON.stringify(f.data).slice(0, 120)}</Typography>
          ))}
        </Box>
      </Box>
      <Button sx={{ mt: 2 }} variant="contained" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Scroll to top</Button>
    </Box>
  );
}
