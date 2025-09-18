-- Create prediction_runs table
CREATE TABLE prediction_runs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    spot_price DECIMAL(10,2),
    strike_price DECIMAL(10,2),
    time_to_expiry DECIMAL(8,4),
    risk_free_rate DECIMAL(6,4),
    dividend_yield DECIMAL(6,4),
    volatility DECIMAL(6,4),
    option_type VARCHAR(4) CHECK (option_type IN ('call', 'put')),
    market_price DECIMAL(10,4),
    calculated_price DECIMAL(10,4),
    delta DECIMAL(8,4),
    gamma DECIMAL(8,4),
    theta DECIMAL(8,4),
    vega DECIMAL(8,4),
    rho DECIMAL(8,4),
    implied_volatility DECIMAL(6,4),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_prediction_runs_user_id ON prediction_runs(user_id);
CREATE INDEX idx_prediction_runs_symbol ON prediction_runs(symbol);
CREATE INDEX idx_prediction_runs_created_at ON prediction_runs(created_at);
CREATE INDEX idx_prediction_runs_user_created ON prediction_runs(user_id, created_at DESC);
