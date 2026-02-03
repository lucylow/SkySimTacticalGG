import React, { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import useAgentStream from '../hooks/useAgentStream';
import { startAgentStreamUrl } from '../services/api_new';

export default function AgentConsole() {
  const [prompt, setPrompt] = useState('Analyze match: test');
  const [url, setUrl] = useState<string | null>(null);
  const { events, connected, reset } = useAgentStream(url);

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Agent Console</Typography>
          <TextField fullWidth multiline rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} sx={{ mt: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" onClick={() => { reset(); setUrl(startAgentStreamUrl(prompt)); }}>
              Start Stream
            </Button>
            <Button variant="outlined" onClick={() => { setUrl(null); reset(); }}>
              Stop
            </Button>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Connection: {connected ? 'connected' : 'disconnected'}
          </Typography>
        </CardContent>
      </Card>

      <Box>
        {events.map((ev, i) => (
          <Card key={i} sx={{ my: 1 }}>
            <CardContent>
              <Typography variant="subtitle2">{ev.type}</Typography>
              <Typography component="pre" sx={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(ev.data, null, 2)}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
