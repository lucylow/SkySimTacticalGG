import React from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import useSWR from 'swr';
import api from '../../services/api_new';

const fetcher = (url: string) => api.get(url).then(r => r.data);

export function Dashboard() {
  const { data: products } = useSWR('/products', fetcher);
  const { data: sessions } = useSWR('/sessions', fetcher);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">Recent Sessions</Typography>
              {sessions ? (
                sessions.slice(0, 5).map((s: any) => <Typography key={s.id}>{s.title}</Typography>)
              ) : (<Typography>Loading...</Typography>)}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Products (sample)</Typography>
              {products ? (
                products.slice(0, 5).map((p: any) => <Typography key={p.id}>{p.name}</Typography>)
              ) : (<Typography>Loading...</Typography>)}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
