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
  crypto_market_error?: string | null;
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

export interface PortfolioAssistantRequest {
  snapshot: PortfolioSummaryPayload;
  messages: AssistantMessage[];
}

export interface PortfolioAssistantResponse {
  reply: string;
}

export interface OptionValuationSnapshotInputs {
  symbol: string;
  expiry: string;
  side: OptionSide;
  S: number;
  K: number;
  r: number;
  q: number;
  sigma: number;
  T: number;
  d1?: number;
  d2?: number;
}

export interface OptionValuationSnapshotGreeks {
  fair_value: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface EuroOptionValuationSnapshot {
  inputs: OptionValuationSnapshotInputs;
  greeks: OptionValuationSnapshotGreeks;
}

export interface AmericanOptionValuationSnapshot {
  inputs: OptionValuationSnapshotInputs;
  greeks: OptionValuationSnapshotGreeks;
  intrinsic_value: number;
  time_value: number;
}

export interface AssistantEuroRequest {
  snapshot: EuroOptionValuationSnapshot;
  messages?: AssistantMessage[];
  message?: string;
}

export interface AssistantEuroResponse {
  reply: string;
}

export interface AssistantAmericanRequest {
  snapshot: AmericanOptionValuationSnapshot;
  messages?: AssistantMessage[];
  message?: string;
}

export interface AssistantAmericanResponse {
  reply: string;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  min_order_size: number;
  min_trade_increment: number;
  price_increment: number;
}

export interface CryptoAssetApi {
  id: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  min_order_size: string;
  min_trade_increment: string;
  price_increment: string;
}

export interface CryptoAssetsApiResponse {
  ok: boolean;
  error?: string;
  assets: CryptoAssetApi[];
}

export interface CryptoPositionApi {
  symbol: string;
  quantity: string;
  avg_cost: string;
  market_price: string | null;
  market_value: string | null;
  unrealized_pnl: string | null;
}

export interface CryptoPosition {
  symbol: string;
  quantity: number;
  avg_cost: number;
  market_price: number | null;
  market_value: number | null;
  unrealized_pnl: number | null;
}

export interface CryptoPositionsApiResponse {
  ok: boolean;
  error?: string;
  portfolio_id: number;
  positions: CryptoPositionApi[];
}

export interface CryptoTradeApi {
  id: number;
  symbol: string;
  side: TradeSide;
  quantity: string;
  price: string;
  fees: string;
  order_type: string;
  created_at: string;
}

export interface CryptoTradesApiResponse {
  ok: boolean;
  error?: string;
  trades: CryptoTradeApi[];
}

export interface CryptoTradeExecutionResponse {
  ok: boolean;
  error?: string;
  portfolio?: {
    id: number;
    cash_balance: string;
  };
  trade?: CryptoTradeApi;
}