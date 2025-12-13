// src/pages/Landing.tsx
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function Landing() {
  const navigate = useNavigate();

  return (
    <Box>

      <Box
        sx={{
          position: 'relative',
          height: '500px',
          backgroundImage: 'url(https://cdn.pixabay.com/photo/2020/03/28/16/03/dog-4977599_1280.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography variant="h2" color="white" fontWeight="bold" gutterBottom>
            Financial Literacy Platform
          </Typography>
          <Typography variant="h5" color="white" sx={{ mb: 4, opacity: 0.9 }}>
            Virtual Stock Exchange & Option Sensitivity Pricing
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/american-options-pricing')}
              sx={{ px: 4, py: 1.5 }}
            >
              American Options
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/euro-options-pricing')}
              sx={{
                px: 4,
                py: 1.5,
                color: 'white',
                borderColor: 'white',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              European Options
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom sx={{ mb: 6 }}>
          Why Choose Our Platform?
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gap: 6,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          }}
        >
          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUpIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight="600">
              Simulated Stock Market
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Execute on trades and realize strategies
            </Typography>
          </Stack>

                    <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TimelineIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight="600">
              Greeks at a Glance
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visualize Delta, Gamma, Vega, Theta, and Rho to understand risk without noise.
            </Typography>
          </Stack>

          <Stack spacing={2} alignItems="center" textAlign="center">
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SaveAltIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight="600">
              Save and Compare
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Keep multiple portfolios and strategies
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}