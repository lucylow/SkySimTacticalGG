import React from 'react';
import { Box, List, ListItem, ListItemText } from '@mui/material';

export default function Timeline({ matchId }: { matchId: string }) {
  // stubbed sample events — replace with API call in real use
  const events = Array.from({ length: 60 }).map((_, i) => ({ id: i, ts: i * 15, text: `Event ${i}` }));

  return (
    <Box>
      <List dense sx={{ maxHeight: 600, overflow: 'auto' }}>
        {events.map(ev => (
          <ListItem key={ev.id}>
            <ListItemText primary={ev.text} secondary={`t=${ev.ts}s`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
