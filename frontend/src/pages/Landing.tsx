// src/pages/Landing.tsx
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { Box, Container, Stack, Typography } from '@mui/material';

export function Landing() {
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 } }}>
      <Box
        sx={{
          display: 'grid',
          gap: 4,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        {/* col 1 */}
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TrendingUpIcon color="primary" />
            <Typography variant="h6">Real-time ready</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Integrate market data and compute prices in seconds with calm, legible visuals.
          </Typography>
        </Stack>

        {/* col 2 */}
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TimelineIcon color="primary" />
            <Typography variant="h6">Greeks at a glance</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Visualize Delta, Gamma, Vega, Theta, and Rho to understand risk without noise.
          </Typography>
        </Stack>

        {/* col 3 */}
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SaveAltIcon color="primary" />
            <Typography variant="h6">Save and compare</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Organize scenarios, export results, and revisit saved predictions anytime.
          </Typography>
        </Stack>
      </Box>
    </Container>
  );
}
