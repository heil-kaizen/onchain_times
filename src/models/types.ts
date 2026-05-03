export interface ExecutedTradeRecord {
  trade_id: string;
  trade_type: 'BUY' | 'SELL';
  token_symbol: string;
  token_address: string;
  execution_price_usd: number;
  market_cap_at_trade: number;
  trade_quantity: number;
  total_usd_value: number;
  execution_timestamp: number;
}

export interface VirtualPortfolioState {
  solana_wallet_balance: number;
  token_holdings_quantity: number;
  trade_history: ExecutedTradeRecord[];
}

export interface PricePoint {
  timestamp: number;
  price_in_sol: number;
}
