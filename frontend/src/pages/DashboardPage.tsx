import { Box, Container, Typography } from '@mui/material';
import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Box>
        <Typography variant="body1">
          Welcome to your FinanceBuddy dashboard! This is where you'll see your
          recent calculations, saved predictions, and quick access to tools.
        </Typography>
      </Box>
    </Container>
  );
};

export default DashboardPage;
