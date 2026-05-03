import React, { useState, useEffect } from 'react';
import { fetch_moralis_metadata, fetch_moralis_price, discover_pair_address } from '../services/moralis_service';
import { VirtualPortfolioState, ExecutedTradeRecord } from '../models/types';
import LightweightChart from './components/LightweightChart';
import TradePanel from './components/TradePanel';
import HistoryList from './components/HistoryList';
import { normalizeTokenMetadata } from '../utils/token_normalizer';
import { resolveMissingMetadata } from '../utils/metadata_resolver';

import { formatFinancialNumber } from '../utils/formatters';

export default function TokenDetail({ tokenAddress, onBack }: { tokenAddress: string, onBack: () => void }) {
  const [portfolio_state, set_portfolio_state] = useState<VirtualPortfolioState>({
    solana_wallet_balance: 300, // Initial 300 USD
    token_holdings_quantity: 0,
    trade_history: []
  });

  const [current_price, set_current_price] = useState<number | null>(null);
  const [current_mc, set_current_mc] = useState<number | null>(null);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [symbol, setSymbol] = useState<string>("Unknown");
  const [tokenName, setTokenName] = useState<string>("Unknown");
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const loadInfo = async () => {
      try {
        const results = await Promise.allSettled([
          fetch_moralis_metadata(tokenAddress),
          fetch_moralis_price(tokenAddress)
        ]);
        
        const metaData = results[0].status === 'fulfilled' ? results[0].value : null;
        let priceData = results[1].status === 'fulfilled' ? results[1].value : null;
        
        // Fallback for price if Moralis fails
        if (!priceData) {
           try {
             const { fetch_token_pair_info } = await import('../services/dexscreener_service');
             const dsData = await fetch_token_pair_info(tokenAddress);
             if (dsData) {
               priceData = { usdPrice: parseFloat(dsData.priceUsd || "0") };
             }
           } catch (dsErr) {
             console.warn("DexScreener price fallback failed", dsErr);
           }
        }

        if (metaData) {
           let normalized = normalizeTokenMetadata(metaData, tokenAddress);
           // Fallback to BirdEye for extra metadata if needed
           normalized = await resolveMissingMetadata(normalized);
           
           if (!isMounted) return;
           
           const price = priceData?.usdPrice || 0;
           const rawMC = metaData.marketCap || metaData.fullyDilutedValue || metaData.marketCapUsd;
           const rawSupply = metaData.totalSupply || metaData.totalSupplyFormatted;
           
           const mc = rawMC ? parseFloat(String(rawMC)) : (price * parseFloat(String(rawSupply || 0)));
           
           set_current_price(price);
           set_current_mc(mc);
           setSymbol(normalized.token_symbol || "UNKNOWN");
           setTokenName(normalized.token_name || "Unknown Asset");
           
           setMarketData({
             mc: mc,
             liquidity: parseFloat(String(metaData.liquidity || metaData.liquidityUsd || 0)),
             totalSupply: parseFloat(String(rawSupply || 0)),
             verified: metaData.isVerifiedContract || metaData.verified || false
           });
           
           // Discover pair for chart fallback
           const pair = await discover_pair_address(tokenAddress);
           if (isMounted) setPoolAddress(pair);
        } else {
           throw new Error('Could not retrieve token identity from API');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Token load failed", err);
        set_error_message(err.message || 'Market data unreachable');
      }
    };
    loadInfo();
    
    // Polling price and stats
    const interval = setInterval(loadInfo, 15000);
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, [tokenAddress]);

  const execute_market_buy = (spend_amount: number) => {
    if (!current_price || current_price <= 0 || !current_mc) return;
    if (spend_amount > portfolio_state.solana_wallet_balance || spend_amount <= 0) return;

    const bought_token_quantity = spend_amount / current_price;
    const trade_record: ExecutedTradeRecord = {
      trade_id: crypto.randomUUID(),
      trade_type: 'BUY',
      token_symbol: symbol,
      token_address: tokenAddress,
      execution_price_usd: current_price,
      market_cap_at_trade: current_mc,
      trade_quantity: bought_token_quantity,
      total_usd_value: spend_amount,
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
    if (!current_price || current_price <= 0 || !current_mc) return;
    if (sell_token_quantity > portfolio_state.token_holdings_quantity || sell_token_quantity <= 0) return;

    const gained_amount = sell_token_quantity * current_price;
    const trade_record: ExecutedTradeRecord = {
      trade_id: crypto.randomUUID(),
      trade_type: 'SELL',
      token_symbol: symbol,
      token_address: tokenAddress,
      execution_price_usd: current_price,
      market_cap_at_trade: current_mc,
      trade_quantity: sell_token_quantity,
      total_usd_value: gained_amount,
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
                Current: {current_price ? `$${current_price.toFixed(8)}` : 'Evaluating...'}
              </span>
            </div>
            
            {marketData && (
              <div className="flex flex-wrap gap-4 mb-4 font-mono text-xs border border-[#1a1a1a] p-2 bg-[#F4F1EA]">
                <div><span className="opacity-70 uppercase tracking-tighter">MC:</span> {formatFinancialNumber(marketData.mc)}</div>
                <div><span className="opacity-70 uppercase tracking-tighter">Supply:</span> {formatFinancialNumber(marketData.totalSupply)}</div>
                {marketData.verified && <div className="text-emerald-700 font-bold uppercase tracking-tighter">✓ Verified</div>}
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
              current_mc={current_mc}
              portfolio_state={portfolio_state} 
              on_buy={execute_market_buy} 
              on_sell={execute_market_sell} 
            />
          </div>
        </div>

        <section className="mb-12">
          <h2 className="font-headline text-2xl font-black mb-4 border-b-[3px] border-[#1a1a1a] uppercase tracking-widest">Transaction Ledger</h2>
          <div className="border-[3px] border-[#1a1a1a] bg-white p-4 max-h-[400px] overflow-auto shadow-[6px_6px_0_#1a1a1a]">
            <HistoryList trade_history={portfolio_state.trade_history} current_mc={current_mc} />
          </div>
        </section>

      </div>
    </div>
  );
}
