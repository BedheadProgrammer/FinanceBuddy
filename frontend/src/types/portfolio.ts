export type TradeSide = "BUY" | "SELL";

export type PortfolioInfo = {
  id: number;
  name: string;
  currency: string;
  initial_cash: number;
  cash_balance: number;
  positions_value: number;
  total_equity: number;
};

export type PortfolioPosition = {
  symbol: string;
  quantity: number;
  avg_cost: number;
  market_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  error?: string;
};

export type PortfolioSummaryPayload = {
  portfolio: PortfolioInfo;
  positions: PortfolioPosition[];
  market_error: string | null;
};

export type TradeResponse = {
  ok: boolean;
  portfolio: {
    id: number;
    cash_balance: number;
  };
  trade: {
    id: number;
    symbol: string;
    side: TradeSide;
    quantity: number;
    price: number;
    fees: number;
    executed_at: string;
  };
  error?: string;
};

export type AssistantMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export type OptionSide = "CALL" | "PUT";
export type OptionStyle = "EUROPEAN" | "AMERICAN";

export type OptionPositionApi = {
  id: number;
  portfolio_id: number;
  contract_id: number;
  underlying_symbol: string;
  option_side: OptionSide;
  option_style: OptionStyle;
  strike: string;
  expiry: string;
  multiplier: number;
  quantity: string;
  avg_cost: string;
};

export type OptionPositionsApiResponse = {
  portfolio: {
    id: number;
    cash: string;
  };
  positions: OptionPositionApi[];
  error?: string;
};

export type OptionPosition = {
  id: number;
  contract_id: number;
  underlying_symbol: string;
  option_side: OptionSide;
  option_style: OptionStyle;
  strike: number;
  expiry: string;
  multiplier: number;
  quantity: number;
  avg_cost: number;
};

export type OptionTradeResponse = {
  trade: {
    id: number;
    portfolio_id: number;
    contract_id: number;
    side: TradeSide;
    quantity: string;
    price: string;
    fees: string;
    order_type: string;
    status: string;
    realized_pl: string;
    underlying_price_at_execution: string | null;
    executed_at: string;
  };
  contract: {
    id: number;
    underlying_symbol: string;
    option_side: OptionSide;
    option_style: OptionStyle;
    strike: string;
    expiry: string;
    multiplier: number;
    contract_symbol: string | null;
  };
  portfolio: {
    id: number;
    cash: string;
  };
  position: {
    id: number;
    quantity: string;
    avg_cost: string;
  } | null;
  error?: string;
};

export type OptionExerciseResponse = {
  exercise: {
    id: number;
    portfolio_id: number;
    contract_id: number;
    quantity: string;
    underlying_price_at_exercise: string;
    intrinsic_value_per_contract: string;
    intrinsic_value_total: string;
    option_realized_pl: string;
    cash_delta: string;
    exercised_at: string;
  };
  contract: {
    id: number;
    underlying_symbol: string;
    option_side: OptionSide;
    option_style: OptionStyle;
    strike: string;
    expiry: string;
    multiplier: number;
    contract_symbol: string | null;
  };
  portfolio: {
    id: number;
    cash: string;
  };
  position: {
    id: number;
    quantity: string;
    avg_cost: string;
  } | null;
  error?: string;
};
