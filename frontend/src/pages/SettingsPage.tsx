import { Box, Container, Typography } from '@mui/material';
import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Box>
        <Typography variant="body1">
          User settings and preferences will be configured here.
        </Typography>
      </Box>
    </Container>
  );
};

export default SettingsPage;
