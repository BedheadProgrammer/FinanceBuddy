export type TradeSide = "BUY" | "SELL";
export type OptionSide = "CALL" | "PUT";
export type OptionStyle = "EUROPEAN" | "AMERICAN";


export interface PortfolioInfo {
  id: number;
  name: string;
  currency: string;
  initial_cash: number;
  cash_balance: number;
  positions_value: number;
  total_equity: number;
  is_default?: boolean;
  created_at?: string;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  avg_cost: number;
  market_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
  error?: string | null;
}

export interface PortfolioSummaryPayload {
  portfolio: PortfolioInfo;
  positions: PortfolioPosition[];
  market_error: string | null;
}

export interface TradeResponse {
  ok: boolean;
  error?: string;
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
}

export interface AssistantMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}


export interface OptionPositionApi {
  id: number;
  contract_id: number;
  underlying_symbol: string;
  option_side: OptionSide;
  option_style: OptionStyle;
  strike: string;
  expiry: string;
  multiplier: number;
  quantity: string;
  avg_cost: string;
}

export interface OptionPositionsApiResponse {
  portfolio: {
    id: number;
    cash: string;
  };
  positions: OptionPositionApi[];
  error?: string;
}

export interface OptionPosition {
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
}

export interface OptionTradeResponse {
  trade: {
    id: number;
    portfolio_id: number;
    contract_id: number;
    side: TradeSide;
    quantity: string;
    price: string;
    fees: string;
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
}

export interface OptionExerciseResponse {
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
}

export interface Portfolio {
  id: number;
  name: string;
  currency: string;
  initial_cash: number;
  cash_balance: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  positions_count?: number;
  option_positions_count?: number;
  cost_basis?: number;
}

export interface PortfolioListResponse {
  portfolios: Portfolio[];
  count: number;
}

export interface CreatePortfolioResponse {
  portfolio: Portfolio;
  message: string;
  error?: string;
}

export interface UpdatePortfolioResponse {
  portfolio: Portfolio;
  message: string;
  error?: string;
}

export interface DeletePortfolioResponse {
  message: string;
  had_positions: boolean;
  new_default_id: number | null;
  error?: string;
}

export interface SetDefaultPortfolioResponse {
  portfolio: Portfolio;
  message: string;
  error?: string;
}

export interface CreatePortfolioInput {
  name: string;
  initial_cash: number;
  currency?: string;
  set_as_default?: boolean;
}

export interface UpdatePortfolioInput {
  name?: string;
}