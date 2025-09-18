package com.financebuddy.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "prediction_runs")
public class PredictionRun {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @NotBlank
    @Size(max = 10)
    private String symbol;
    
    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "spot_price", precision = 10, scale = 2)
    private BigDecimal spotPrice;
    
    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "strike_price", precision = 10, scale = 2)
    private BigDecimal strikePrice;
    
    @DecimalMin(value = "0.0", inclusive = false)
    @DecimalMax(value = "10.0", inclusive = true)
    @Column(name = "time_to_expiry", precision = 8, scale = 4)
    private BigDecimal timeToExpiry;
    
    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "0.15", inclusive = true)
    @Column(name = "risk_free_rate", precision = 6, scale = 4)
    private BigDecimal riskFreeRate;
    
    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "0.10", inclusive = true)
    @Column(name = "dividend_yield", precision = 6, scale = 4)
    private BigDecimal dividendYield;
    
    @DecimalMin(value = "0.0", inclusive = true)
    @DecimalMax(value = "1.0", inclusive = true)
    @Column(precision = 6, scale = 4)
    private BigDecimal volatility;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "option_type")
    private OptionType optionType;
    
    @Column(name = "market_price", precision = 10, scale = 4)
    private BigDecimal marketPrice;
    
    @Column(name = "calculated_price", precision = 10, scale = 4)
    private BigDecimal calculatedPrice;
    
    @Column(precision = 8, scale = 4)
    private BigDecimal delta;
    
    @Column(precision = 8, scale = 4)
    private BigDecimal gamma;
    
    @Column(precision = 8, scale = 4)
    private BigDecimal theta;
    
    @Column(precision = 8, scale = 4)
    private BigDecimal vega;
    
    @Column(precision = 8, scale = 4)
    private BigDecimal rho;
    
    @Column(name = "implied_volatility", precision = 6, scale = 4)
    private BigDecimal impliedVolatility;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public PredictionRun() {}
    
    public PredictionRun(User user, String symbol, BigDecimal spotPrice, BigDecimal strikePrice, 
                        BigDecimal timeToExpiry, BigDecimal riskFreeRate, BigDecimal dividendYield, 
                        BigDecimal volatility, OptionType optionType) {
        this.user = user;
        this.symbol = symbol;
        this.spotPrice = spotPrice;
        this.strikePrice = strikePrice;
        this.timeToExpiry = timeToExpiry;
        this.riskFreeRate = riskFreeRate;
        this.dividendYield = dividendYield;
        this.volatility = volatility;
        this.optionType = optionType;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getSymbol() {
        return symbol;
    }
    
    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }
    
    public BigDecimal getSpotPrice() {
        return spotPrice;
    }
    
    public void setSpotPrice(BigDecimal spotPrice) {
        this.spotPrice = spotPrice;
    }
    
    public BigDecimal getStrikePrice() {
        return strikePrice;
    }
    
    public void setStrikePrice(BigDecimal strikePrice) {
        this.strikePrice = strikePrice;
    }
    
    public BigDecimal getTimeToExpiry() {
        return timeToExpiry;
    }
    
    public void setTimeToExpiry(BigDecimal timeToExpiry) {
        this.timeToExpiry = timeToExpiry;
    }
    
    public BigDecimal getRiskFreeRate() {
        return riskFreeRate;
    }
    
    public void setRiskFreeRate(BigDecimal riskFreeRate) {
        this.riskFreeRate = riskFreeRate;
    }
    
    public BigDecimal getDividendYield() {
        return dividendYield;
    }
    
    public void setDividendYield(BigDecimal dividendYield) {
        this.dividendYield = dividendYield;
    }
    
    public BigDecimal getVolatility() {
        return volatility;
    }
    
    public void setVolatility(BigDecimal volatility) {
        this.volatility = volatility;
    }
    
    public OptionType getOptionType() {
        return optionType;
    }
    
    public void setOptionType(OptionType optionType) {
        this.optionType = optionType;
    }
    
    public BigDecimal getMarketPrice() {
        return marketPrice;
    }
    
    public void setMarketPrice(BigDecimal marketPrice) {
        this.marketPrice = marketPrice;
    }
    
    public BigDecimal getCalculatedPrice() {
        return calculatedPrice;
    }
    
    public void setCalculatedPrice(BigDecimal calculatedPrice) {
        this.calculatedPrice = calculatedPrice;
    }
    
    public BigDecimal getDelta() {
        return delta;
    }
    
    public void setDelta(BigDecimal delta) {
        this.delta = delta;
    }
    
    public BigDecimal getGamma() {
        return gamma;
    }
    
    public void setGamma(BigDecimal gamma) {
        this.gamma = gamma;
    }
    
    public BigDecimal getTheta() {
        return theta;
    }
    
    public void setTheta(BigDecimal theta) {
        this.theta = theta;
    }
    
    public BigDecimal getVega() {
        return vega;
    }
    
    public void setVega(BigDecimal vega) {
        this.vega = vega;
    }
    
    public BigDecimal getRho() {
        return rho;
    }
    
    public void setRho(BigDecimal rho) {
        this.rho = rho;
    }
    
    public BigDecimal getImpliedVolatility() {
        return impliedVolatility;
    }
    
    public void setImpliedVolatility(BigDecimal impliedVolatility) {
        this.impliedVolatility = impliedVolatility;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public enum OptionType {
        CALL, PUT
    }
}
