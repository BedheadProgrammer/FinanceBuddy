// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

type PricesResponse = Record<
  string,
  {
    price: number | null;
    error: string | null;
  }
>;

export function Dashboard() {
  const [symbols, setSymbols] = useState<string>('AAPL,MSFT');
  const [data, setData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  usePageMeta(
    'Dashboard | FinanceBuddy',
    'Quickly check live market prices and access FinanceBuddy tools for options pricing and analysis.'
  );

  const fetchPrices = async (s: string) => {
    const qs = s.trim();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/prices?symbols=${encodeURIComponent(qs)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setErr('Authentication required. Sign in and try again.');
          setData(null);
          return;
        }
        setErr(`HTTP ${res.status}`);
        setData(null);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setErr('Unexpected response (not JSON).');
        setData(null);
        return;
      }

      const json = (await res.json()) as PricesResponse;
      setData(json);
    } catch (e: any) {
      setErr(e?.message || 'Failed to fetch prices');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices(symbols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 6 },
          px: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            lineHeight: 1.2,
          }}
        >
          Your Financial Toolkit
        </Typography>
        <Typography
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            color: 'rgba(15, 23, 42, 0.7)',
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          Analyze options and track market data in real-time
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          alignItems: 'flex-start',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 2fr) minmax(0, 1.2fr)',
          },
          px: 2,
          pb: 6,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              '&:hover': {
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.22)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'rgba(15, 23, 42, 0.95)',
                mb: 3,
              }}
            >
              Live market prices
            </Typography>

            <Stack spacing={2}>
             <TextField
  fullWidth
  label="Stock symbols"
  placeholder="AAPL, MSFT, GOOGL"
  value={symbols}
  onChange={(e) => setSymbols(e.target.value)}
  sx={{
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#ffffff',
      color: 'rgba(15, 23, 42, 0.95)',
      '& fieldset': {
        borderColor: 'rgba(15, 23, 42, 0.15)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(15, 23, 42, 0.3)',
      },
    },
  }}
/>

              <Button
                onClick={() => fetchPrices(symbols)}
                disabled={loading || !symbols.trim()}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.98)',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(15, 23, 42, 1)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  },
                }}
              >
                {loading ? 'Loading...' : 'Get prices'}
              </Button>

              {err && <Alert severity="error">{err}</Alert>}

              <Box
                sx={{
                  position: 'relative',
                  minHeight: 120,
                  backgroundColor: '#f8fafc',
                  borderRadius: 2,
                  p: 3,
                }}
              >
                {loading && (
                  <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{ position: 'absolute', inset: 0 }}
                  >
                    <CircularProgress size={32} />
                  </Stack>
                )}

                {!loading && !data && !err && (
                  <Typography sx={{ color: 'rgba(15, 23, 42, 0.5)' }}>
                    Enter symbols above to see live prices
                  </Typography>
                )}

                {!loading && data && Object.keys(data).length === 0 && (
                  <Typography sx={{ color: 'rgba(15, 23, 42, 0.5)' }}>
                    No results found
                  </Typography>
                )}

                {!loading && data && Object.keys(data).length > 0 && (
                  <Stack spacing={2}>
                    {Object.entries(data).map(([sym, { price, error }]) => (
                      <Box
                        key={sym}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          backgroundColor: '#ffffff',
                          borderRadius: 1.5,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'rgba(15, 23, 42, 0.95)',
                          }}
                        >
                          {sym}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color:
                              price !== null
                                ? 'rgba(16, 185, 129, 0.95)'
                                : 'rgba(239, 68, 68, 0.9)',
                          }}
                        >
                          {price !== null
                            ? `$${price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : error || 'n/a'}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Card>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card
            component={RouterLink}
            to="/calculator"
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              textDecoration: 'none',
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              '&:hover': {
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.22)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'rgba(15, 23, 42, 0.95)',
                mb: 1,
              }}
            >
              Options calculator
            </Typography>
            <Typography
              sx={{ color: 'rgba(15, 23, 42, 0.6)', fontSize: '0.9rem' }}
            >
              Price options using Black–Scholes and explore payoff profiles.
            </Typography>
          </Card>

          <Card
            component={RouterLink}
            to="/saved"
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.96)',
              textDecoration: 'none',
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              '&:hover': {
                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.22)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'rgba(15, 23, 42, 0.95)',
                mb: 1,
              }}
            >
              Saved predictions
            </Typography>
            <Typography
              sx={{ color: 'rgba(15, 23, 42, 0.6)', fontSize: '0.9rem' }}
            >
              Revisit previous scenarios and compare your assumptions over time.
            </Typography>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
