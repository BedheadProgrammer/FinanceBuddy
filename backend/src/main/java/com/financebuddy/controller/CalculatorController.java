package com.financebuddy.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calculator")
@CrossOrigin(origins = "http://localhost:3000")
public class CalculatorController {

    @PostMapping("/price")
    public Map<String, Object> calculateOptionPrice(@RequestBody Map<String, Object> request) {
        // Mock calculation for now - will implement real Black-Scholes later
        Map<String, Object> response = new HashMap<>();
        
        // Extract parameters from request
        String symbol = (String) request.get("symbol");
        Double spotPrice = Double.parseDouble(request.get("spotPrice").toString());
        Double strikePrice = Double.parseDouble(request.get("strikePrice").toString());
        Double timeToExpiry = Double.parseDouble(request.get("timeToExpiry").toString());
        Double volatility = Double.parseDouble(request.get("volatility").toString());
        Double riskFreeRate = Double.parseDouble(request.get("riskFreeRate").toString());
        Double dividendYield = Double.parseDouble(request.get("dividendYield").toString());
        String optionType = (String) request.get("optionType");
        
        // Mock Black-Scholes calculation
        double price = calculateBlackScholes(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType);
        double delta = calculateDelta(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType);
        double gamma = calculateGamma(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
        double theta = calculateTheta(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType);
        double vega = calculateVega(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility);
        double rho = calculateRho(spotPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, optionType);
        
        response.put("price", Math.round(price * 100.0) / 100.0);
        response.put("delta", Math.round(delta * 1000.0) / 1000.0);
        response.put("gamma", Math.round(gamma * 1000.0) / 1000.0);
        response.put("theta", Math.round(theta * 1000.0) / 1000.0);
        response.put("vega", Math.round(vega * 1000.0) / 1000.0);
        response.put("rho", Math.round(rho * 1000.0) / 1000.0);
        response.put("symbol", symbol);
        response.put("optionType", optionType);
        
        return response;
    }
    
    // Mock Black-Scholes calculation
    private double calculateBlackScholes(double S, double K, double T, double r, double sigma, String optionType) {
        // Simplified Black-Scholes for demonstration
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        double d2 = d1 - sigma * Math.sqrt(T);
        
        double N_d1 = normalCDF(d1);
        double N_d2 = normalCDF(d2);
        
        if ("call".equals(optionType)) {
            return S * N_d1 - K * Math.exp(-r * T) * N_d2;
        } else {
            return K * Math.exp(-r * T) * (1 - N_d2) - S * (1 - N_d1);
        }
    }
    
    private double calculateDelta(double S, double K, double T, double r, double sigma, String optionType) {
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        double N_d1 = normalCDF(d1);
        
        if ("call".equals(optionType)) {
            return N_d1;
        } else {
            return N_d1 - 1;
        }
    }
    
    private double calculateGamma(double S, double K, double T, double r, double sigma) {
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        return normalPDF(d1) / (S * sigma * Math.sqrt(T));
    }
    
    private double calculateTheta(double S, double K, double T, double r, double sigma, String optionType) {
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        double d2 = d1 - sigma * Math.sqrt(T);
        
        double term1 = -S * normalPDF(d1) * sigma / (2 * Math.sqrt(T));
        double term2 = -r * K * Math.exp(-r * T) * normalCDF(d2);
        
        if ("call".equals(optionType)) {
            return term1 + term2;
        } else {
            return term1 - term2;
        }
    }
    
    private double calculateVega(double S, double K, double T, double r, double sigma) {
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        return S * Math.sqrt(T) * normalPDF(d1);
    }
    
    private double calculateRho(double S, double K, double T, double r, double sigma, String optionType) {
        double d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        double d2 = d1 - sigma * Math.sqrt(T);
        
        if ("call".equals(optionType)) {
            return K * T * Math.exp(-r * T) * normalCDF(d2);
        } else {
            return -K * T * Math.exp(-r * T) * normalCDF(-d2);
        }
    }
    
    // Approximate normal CDF
    private double normalCDF(double x) {
        return 0.5 * (1 + erf(x / Math.sqrt(2)));
    }
    
    // Approximate normal PDF
    private double normalPDF(double x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }
    
    // Approximate error function
    private double erf(double x) {
        double a1 =  0.254829592;
        double a2 = -0.284496736;
        double a3 =  1.421413741;
        double a4 = -1.453152027;
        double a5 =  1.061405429;
        double p  =  0.3275911;
        
        int sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        
        double t = 1.0 / (1.0 + p * x);
        double y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }
}
