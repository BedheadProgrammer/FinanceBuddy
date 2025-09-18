import {
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Toolbar,
    Typography,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FinanceBuddy
          </Typography>
          <Button color="inherit" onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button color="inherit" onClick={() => navigate('/register')}>
            Register
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" component="h1" gutterBottom>
            FinanceBuddy
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Make Options Trading Simple & Educational
          </Typography>
          <Typography variant="body1" paragraph>
            Calculate option prices using Black-Scholes model with AI-powered explanations.
            Perfect for students, analysts, and retail investors.
          </Typography>
        </Box>

        <Grid container spacing={4} mb={6}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  📊 Calculate Option Prices
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the Black-Scholes model to calculate theoretical option prices
                  and Greeks with real-time market data integration.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  📈 Market Data Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get real-time stock prices, risk-free rates, and market data
                  from reliable financial data providers.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  🤖 AI Assistant
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get plain-English explanations of option pricing, Greeks,
                  and market conditions from our AI assistant.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/register')}
            sx={{ mr: 2 }}
          >
            Get Started
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/calculator')}
          >
            Try Calculator
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
