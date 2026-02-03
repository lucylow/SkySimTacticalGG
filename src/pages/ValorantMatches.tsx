// src/pages/ValorantMatches.tsx
import React from 'react';
import useSWR from 'swr';
import { fetchValorantMatches } from '../services/mockApi';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function ValorantMatches() {
  const { data, error } = useSWR('valorant-matches', fetchValorantMatches);

  if (error) return <Typography color="error">Failed to load matches</Typography>;
  if (!data) return <Typography>Loading...</Typography>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>Valorant Matches</Typography>
      <List>
        {data.map((m: any) => (
          <ListItem component={RouterLink} to={`/match/valorant/${m.id}`} key={m.id} button>
            <ListItemText 
              primary={m.title} 
              secondary={`${m.map} • ${new Date(m.startedAt * 1000).toLocaleString()}`} 
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}
