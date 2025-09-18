import { Box, Container, Typography } from '@mui/material';
import React from 'react';

const AIPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI Assistant
      </Typography>
      <Box>
        <Typography variant="body1">
          Chat with our AI assistant to get explanations about your option calculations.
        </Typography>
      </Box>
    </Container>
  );
};

export default AIPage;
