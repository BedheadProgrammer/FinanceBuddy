import {
    Alert,
    AppBar,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Toolbar,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { CalculationRequest, calculatorService } from '../services/calculatorService';

interface CalculationResults {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

const CalculatorPage: React.FC = () => {
  const [formData, setFormData] = useState({
    symbol: '',
    spotPrice: '',
    strikePrice: '',
    timeToExpiry: '',
    riskFreeRate: '',
    dividendYield: '',
    volatility: '',
    optionType: 'call',
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user changes input
  };

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const request: CalculationRequest = {
        symbol: formData.symbol,
        spotPrice: formData.spotPrice,
        strikePrice: formData.strikePrice,
        timeToExpiry: formData.timeToExpiry,
        riskFreeRate: formData.riskFreeRate,
        dividendYield: formData.dividendYield,
        volatility: formData.volatility,
        optionType: formData.optionType,
      };
      
      const response = await calculatorService.calculateOptionPrice(request);
      setResults(response);
    } catch (error) {
      setError('Failed to calculate option price. Please check your inputs and try again.');
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FinanceBuddy - Options Calculator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Options Price Calculator
        </Typography>

        <Grid container spacing={3}>
          {/* Input Form */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Input Parameters
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Stock Symbol"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value)}
                    placeholder="e.g., AAPL"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Spot Price"
                    type="number"
                    value={formData.spotPrice}
                    onChange={(e) => handleInputChange('spotPrice', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Strike Price"
                    type="number"
                    value={formData.strikePrice}
                    onChange={(e) => handleInputChange('strikePrice', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Time to Expiry (Years)"
                    type="number"
                    value={formData.timeToExpiry}
                    onChange={(e) => handleInputChange('timeToExpiry', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Volatility"
                    type="number"
                    value={formData.volatility}
                    onChange={(e) => handleInputChange('volatility', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Risk-Free Rate"
                    type="number"
                    value={formData.riskFreeRate}
                    onChange={(e) => handleInputChange('riskFreeRate', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Dividend Yield"
                    type="number"
                    value={formData.dividendYield}
                    onChange={(e) => handleInputChange('dividendYield', e.target.value)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Option Type</InputLabel>
                    <Select
                      value={formData.optionType}
                      onChange={(e) => handleInputChange('optionType', e.target.value)}
                    >
                      <MenuItem value="call">Call</MenuItem>
                      <MenuItem value="put">Put</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCalculate}
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Calculate Option Price'}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Calculation Results
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {results ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h4" color="primary">
                          ${results.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Theoretical Price
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {results.delta}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Delta
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {results.gamma}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gamma
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {results.theta}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Theta
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {results.vega}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Vega
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">
                          {results.rho}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rho
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Enter parameters and click "Calculate Option Price" to see results.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CalculatorPage;
