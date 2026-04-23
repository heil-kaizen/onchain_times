import React, { useState, useEffect } from 'react';
import { fetch_token_pair_info } from '../services/dexscreener_service';
import { VirtualPortfolioState, ExecutedTradeRecord } from '../models/types';
import LightweightChart from './components/LightweightChart';
import TradePanel from './components/TradePanel';
import HistoryList from './components/HistoryList';
import { normalizeTokenMetadata } from '../utils/token_normalizer';
import { resolveMissingMetadata } from '../utils/metadata_resolver';

function formatFinancialNumber(num: number | undefined | null): string {
  if (num == null || isNaN(num)) return 'N/A';
  if (num >= 1_000_000_000) return '$' + (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000) return '$' + (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000) return '$' + (num / 1_000).toFixed(2) + 'K';
  return '$' + num.toFixed(2);
}

export default function TokenDetail({ tokenAddress, onBack }: { tokenAddress: string, onBack: () => void }) {
  const [portfolio_state, set_portfolio_state] = useState<VirtualPortfolioState>({
    solana_wallet_balance: 300,
    token_holdings_quantity: 0,
    trade_history: []
  });

  const [current_price, set_current_price] = useState<number | null>(null);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>("Unknown");
  const [tokenName, setTokenName] = useState<string>("Unknown");
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInfo = async () => {
      try {
        const pairInfo = await fetch_token_pair_info(tokenAddress);
        
        if (pairInfo) {
           let normalized = normalizeTokenMetadata(pairInfo, tokenAddress);
           normalized = await resolveMissingMetadata(normalized);
           
           if (!isMounted) return;
           
           set_current_price(parseFloat(pairInfo.priceUsd));
           setSymbol(normalized.token_symbol);
           setTokenName(normalized.token_name);
           
           // Map DexScreener payload to our UI market data format
           setMarketData({
             mc: pairInfo.marketCap || pairInfo.fdv,
             v24hUSD: pairInfo.volume?.h24,
             liquidity: pairInfo.liquidity?.usd
           });
           
           if (pairInfo.pairAddress) {
             setPoolAddress(pairInfo.pairAddress);
           }
        } else {
           throw new Error('No trading data or market stats available');
        }
      } catch (err: any) {
        if (!isMounted) return;
        set_error_message(err.message || 'No trading data available');
      }
    };
    loadInfo();
    return () => { isMounted = false; };
  }, [tokenAddress]);

  const execute_market_buy = (spend_amount: number) => {
    if (!current_price || current_price <= 0) return;
    if (spend_amount > portfolio_state.solana_wallet_balance || spend_amount <= 0) return;

    const bought_token_quantity = spend_amount / current_price;
    const trade_record: ExecutedTradeRecord = {
      trade_id: crypto.randomUUID(),
      trade_type: 'BUY',
      token_symbol: symbol,
      execution_price_in_sol: current_price,
      trade_quantity: bought_token_quantity,
      total_sol_value: spend_amount,
      execution_timestamp: Date.now()
    };

    set_portfolio_state(prev => ({
      ...prev,
      solana_wallet_balance: prev.solana_wallet_balance - spend_amount,
      token_holdings_quantity: prev.token_holdings_quantity + bought_token_quantity,
      trade_history: [trade_record, ...prev.trade_history]
    }));
  };

  const execute_market_sell = (sell_token_quantity: number) => {
    if (!current_price || current_price <= 0) return;
    if (sell_token_quantity > portfolio_state.token_holdings_quantity || sell_token_quantity <= 0) return;

    const gained_amount = sell_token_quantity * current_price;
    const trade_record: ExecutedTradeRecord = {
      trade_id: crypto.randomUUID(),
      trade_type: 'SELL',
      token_symbol: symbol,
      execution_price_in_sol: current_price,
      trade_quantity: sell_token_quantity,
      total_sol_value: gained_amount,
      execution_timestamp: Date.now()
    };

    set_portfolio_state(prev => ({
      ...prev,
      solana_wallet_balance: prev.solana_wallet_balance + gained_amount,
      token_holdings_quantity: prev.token_holdings_quantity - sell_token_quantity,
      trade_history: [trade_record, ...prev.trade_history]
    }));
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] p-4 md:p-6 font-serif">
      <div className="max-w-7xl mx-auto">
        <header className="border-b-[4px] border-[#1a1a1a] pb-4 mb-6 flex justify-between items-end">
          <div className="flex items-end gap-4">
            {onBack && <button onClick={onBack} className="text-xl hover:underline italic font-serif">← Back</button>}
            <h1 className="font-masthead text-4xl md:text-5xl lg:text-6xl pl-4">The Onchain Times</h1>
          </div>
          <div className="text-right font-headline uppercase text-sm border-l-2 border-[#1a1a1a] pl-4">
            <div className="font-bold">Virtual Capital: ${portfolio_state.solana_wallet_balance.toFixed(2)}</div>
            <div className="italic text-[#4b4b4b]">Connection: {error_message ? "Interrupted" : "Secure"}</div>
          </div>
        </header>

        {error_message && (
          <div className="bg-red-50 border-[3px] border-red-800 p-4 mb-6 text-red-800 text-center font-bold font-headline uppercase tracking-widest shadow-[6px_6px_0_#991b1b]">
            {error_message}
          </div>
        )}

        <h2 className="font-headline text-2xl font-black mb-4 border-b-[3px] border-[#1a1a1a] uppercase tracking-widest">
          Trading Desk: {tokenName} {symbol !== 'UNKNOWN' && symbol !== tokenName ? `(${symbol})` : ''}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-[3px] border-[#1a1a1a] bg-white shadow-[6px_6px_0_#1a1a1a] mb-8">
          <div className="lg:col-span-2 flex flex-col p-6">
            <div className="flex justify-between items-end border-b-2 border-[#1a1a1a] pb-2 mb-4">
              <h3 className="font-headline text-xl font-bold uppercase">Live Quotations</h3>
              <span className="font-mono text-sm font-bold bg-[#eeebe2] px-2 border border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
                Current: {current_price ? `$${current_price.toFixed(6)}` : 'Evaluating...'}
              </span>
            </div>
            
            {marketData && (
              <div className="flex flex-wrap gap-4 mb-4 font-mono text-xs border border-[#1a1a1a] p-2 bg-[#F4F1EA]">
                <div><span className="opacity-70">MC:</span> {formatFinancialNumber(marketData.mc)}</div>
                <div><span className="opacity-70">LIQ:</span> {formatFinancialNumber(marketData.liquidity)}</div>
              </div>
            )}

            <div className="border border-[#1a1a1a] bg-[#F4F1EA] flex flex-col items-stretch relative overflow-hidden" style={{ height: "400px" }}>
              {poolAddress ? (
                <div className="absolute inset-0 z-0">
                  <LightweightChart 
                    poolAddress={poolAddress} 
                    trades={portfolio_state.trade_history} 
                    onPriceUpdate={(price) => set_current_price(price)}
                    symbol={symbol}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center animate-pulse tracking-widest text-[#1a1a1a]">
                  LOCATING LIQUIDITY POOL...
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-[#1a1a1a] p-6 flex flex-col bg-[#F4F1EA]">
            <h3 className="font-headline text-xl font-bold border-b-2 border-[#1a1a1a] pb-2 mb-4 uppercase text-center tracking-widest">Execute Order</h3>
            <TradePanel 
              current_price={current_price} 
              portfolio_state={portfolio_state} 
              on_buy={execute_market_buy} 
              on_sell={execute_market_sell} 
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="font-headline text-2xl font-black mb-4 border-b-[3px] border-[#1a1a1a] uppercase tracking-widest">Transaction Ledger</h2>
          <div className="border-[3px] border-[#1a1a1a] bg-white p-4 max-h-[300px] overflow-auto shadow-[6px_6px_0_#1a1a1a]">
            {/* Note: Trade history uses "SOL" labeling inside HistoryList because we use the old model structure, but the data is populated in USD. */}
            <HistoryList trade_history={portfolio_state.trade_history} />
          </div>
        </section>

      </div>
    </div>
  );
}
