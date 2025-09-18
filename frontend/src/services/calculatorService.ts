import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export interface CalculationRequest {
  symbol: string;
  spotPrice: string;
  strikePrice: string;
  timeToExpiry: string;
  riskFreeRate: string;
  dividendYield: string;
  volatility: string;
  optionType: string;
}

export interface CalculationResponse {
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  symbol: string;
  optionType: string;
}

export const calculatorService = {
  calculateOptionPrice: async (request: CalculationRequest): Promise<CalculationResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/calculator/price`, request);
      return response.data;
    } catch (error) {
      console.error('Error calculating option price:', error);
      throw error;
    }
  }
};
