import { Box, Container, Typography } from '@mui/material';
import React from 'react';

const PortfolioPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Portfolio
      </Typography>
      <Box>
        <Typography variant="body1">
          Your saved predictions and portfolio will appear here.
        </Typography>
      </Box>
    </Container>
  );
};

export default PortfolioPage;
