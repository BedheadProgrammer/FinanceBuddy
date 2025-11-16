// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
      const resp = await fetch(`/api/prices?symbols=${encodeURIComponent(qs)}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          setErr('Authentication required. Sign in and try again.');
          setData(null);
          return;
        }
        setErr(`HTTP ${resp.status}`);
        setData(null);
        return;
      }

      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        setErr('Unexpected response (not JSON).');
        setData(null);
        return;
      }

      const json = (await resp.json()) as PricesResponse;
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
    <Stack spacing={2}>
      <Typography variant="h5">Dashboard</Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        }}
      >
        {/* Quick Calculator */}
        <Stack spacing={1}>
          <Typography variant="h6">Quick Calculator</Typography>
          <Button component={RouterLink} to="/calculator" variant="contained">
            Open
          </Button>
        </Stack>

        {/* Recent Predictions */}
        <Stack spacing={1}>
          <Typography variant="h6">Recent Predictions</Typography>
          <Button component={RouterLink} to="/saved" variant="contained">
            View
          </Button>
        </Stack>

        {/* Market Data */}
        <Stack spacing={1}>
          <Typography variant="h6">Market Data</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              label="Symbols (comma-separated)"
              placeholder="AAPL,MSFT,BRK.B"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              onClick={() => fetchPrices(symbols)}
              disabled={loading || !symbols.trim()}
            >
              {loading ? 'Fetching…' : 'Fetch prices'}
            </Button>
          </Stack>

          {err && <Alert severity="error">{err}</Alert>}

          <Box
            sx={{
              position: 'relative',
              minHeight: 80,
              border: (t) => `1px solid ${t.palette.divider}`,
              borderRadius: 1,
              p: 1.5,
            }}
          >
            {loading && (
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{ position: 'absolute', inset: 0 }}
              >
                <CircularProgress size={24} />
              </Stack>
            )}

            {!loading && data && Object.keys(data).length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No results.
              </Typography>
            )}

            {!loading && data && Object.keys(data).length > 0 && (
              <Stack component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }} spacing={0.5}>
                {Object.entries(data).map(([sym, { price, error }]) => (
                  <li key={sym}>
                    <Typography variant="body2">
                      <strong>{sym}</strong>{' '}
                      {price !== null ? (
                        <span>
                          $
                          {price.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </span>
                      ) : (
                        <span style={{ opacity: 0.7 }}>— (error: {error})</span>
                      )}
                    </Typography>
                  </li>
                ))}
              </Stack>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            Uses the Django endpoint at <code>/api/prices?symbols=&lt;list&gt;</code>.
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
