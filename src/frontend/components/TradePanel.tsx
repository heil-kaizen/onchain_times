import React, { useState } from 'react';
import { VirtualPortfolioState } from '../../models/types';
import { TRADING_CONFIG } from '../../config/trading_config';

interface TradePanelProps {
  current_price: number | null;
  current_mc: number | null;
  portfolio_state: VirtualPortfolioState;
  token_symbol?: string;
  on_buy: (spend_usd_amount: number) => void;
  on_sell: (sell_token_quantity: number) => void;
}

export default function TradePanel({ current_price, current_mc, portfolio_state, token_symbol, on_buy, on_sell }: TradePanelProps) {
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [trade_usd_amount, set_trade_usd_amount] = useState<string>("10");

  const handle_amount_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized_value = e.target.value.replace(/[^0-9.]/g, '');
    set_trade_usd_amount(sanitized_value);
  };

  const execute_trade = () => {
    const amount = parseFloat(trade_usd_amount);
    if (isNaN(amount) || amount <= 0 || !current_price) return;

    if (tradeMode === 'BUY') {
      on_buy(amount);
    } else {
      // Amount entered is USD desired to sell, convert to tokens
      const token_quantity_required = amount / current_price;
      on_sell(token_quantity_required);
    }
  };

  const handle_liquidate_all = () => {
    on_sell(portfolio_state.token_holdings_quantity);
  };

  const is_price_loading = !current_price;
  const parsed_usd_amount = parseFloat(trade_usd_amount) || 0;
  
  const is_buy_disabled = is_price_loading || parsed_usd_amount > portfolio_state.solana_wallet_balance || parsed_usd_amount <= 0;
  
  const estimated_token_amount = current_price ? parsed_usd_amount / current_price : 0;
  const is_sell_disabled = is_price_loading || estimated_token_amount > portfolio_state.token_holdings_quantity || estimated_token_amount <= 0;

  const current_balance_tokens = portfolio_state.token_holdings_quantity;
  const current_balance_usd = current_price ? current_balance_tokens * current_price : 0;

  return (
    <div className="flex flex-col gap-0 font-serif">
       {/* Buy/Sell Tabs */}
       <div className="grid grid-cols-2 gap-2 mb-4">
          <button 
            onClick={() => setTradeMode('BUY')}
            className={`py-3 font-headline font-bold uppercase tracking-widest border-2 border-[#1a1a1a] transition-colors shadow-[4px_4px_0_#1a1a1a] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none ${tradeMode === 'BUY' ? 'bg-[#00ffa3] text-[#1a1a1a]' : 'bg-[#1a1a1a] text-[#F4F1EA] opacity-80'}`}
          >
            Buy
          </button>
          <button 
            onClick={() => setTradeMode('SELL')}
            className={`py-3 font-headline font-bold uppercase tracking-widest border-2 border-[#1a1a1a] transition-colors shadow-[4px_4px_0_#1a1a1a] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none ${tradeMode === 'SELL' ? 'bg-[#ff2d55] text-[#F4F1EA]' : 'bg-[#1a1a1a] text-[#F4F1EA] opacity-80'}`}
          >
            Sell
          </button>
       </div>

       {/* Sub Tabs */}
       <div className="flex gap-4 border-b border-[#1a1a1a] mb-4 pb-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#1a1a1a]">
          <span className="border-b-2 border-[#1a1a1a] cursor-default">Market</span>
          <span className="opacity-30 cursor-not-allowed">Limit</span>
          <span className="opacity-30 cursor-not-allowed">Adv.</span>
          <div className="ml-auto flex items-center gap-1">
             <span className="opacity-40">Wallet:</span>
             <span>${portfolio_state.solana_wallet_balance.toFixed(2)}</span>
          </div>
       </div>

       {/* Input Area */}
       <div className="bg-[#eeebe2] border-2 border-[#1a1a1a] p-3 mb-4 shadow-[inset_2px_2px_0_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] uppercase font-bold opacity-40">Amount</span>
             <span className="text-[10px] uppercase font-bold opacity-40">USD</span>
          </div>
          <div className="flex items-center gap-2">
             <input 
                type="text" 
                value={trade_usd_amount} 
                onChange={handle_amount_change}
                className="bg-transparent text-xl font-mono font-bold outline-none w-full"
                placeholder="0.0"
             />
             <span className="font-mono font-bold text-sm">$</span>
          </div>

          {/* Quick Buttons */}
          <div className="grid grid-cols-4 gap-1 mt-3">
             {tradeMode === 'BUY' ? (
                [10, 50, 100, 200].map(val => (
                   <button 
                      key={val}
                      onClick={() => set_trade_usd_amount(val.toString())}
                      className="bg-[#1a1a1a] text-[#F4F1EA] text-[10px] py-1 border border-[#1a1a1a] hover:bg-[#4a4a4a] font-bold"
                   >
                      ${val}
                   </button>
                ))
             ) : (
                [10, 25, 50, 100].map(val => (
                   <button 
                      key={val}
                      onClick={() => {
                         if (current_price) {
                            const qty = portfolio_state.token_holdings_quantity * (val / 100);
                            set_trade_usd_amount((qty * current_price).toFixed(2));
                         }
                      }}
                      className="bg-[#1a1a1a] text-[#F4F1EA] text-[10px] py-1 border border-[#1a1a1a] hover:bg-[#4a4a4a] font-bold"
                   >
                      {val}%
                   </button>
                ))
             )}
          </div>
       </div>

       {/* Stats */}
       <div className="flex justify-between items-center mb-4 px-1 text-[10px] uppercase font-bold text-[#4a4a4a] opacity-60">
          <span>Holdings</span>
          <span>{current_balance_tokens.toFixed(2)} {token_symbol || 'TOKEN'} ({current_balance_usd ? `$${current_balance_usd.toFixed(2)}` : '---'})</span>
       </div>

       {/* Big Action Button */}
       <button 
          onClick={execute_trade}
          disabled={tradeMode === 'BUY' ? is_buy_disabled : is_sell_disabled}
          className={`w-full py-4 text-lg uppercase font-headline font-black tracking-widest border-2 border-[#1a1a1a] transition-all shadow-[6px_6px_0_#1a1a1a] active:translate-y-1 active:translate-x-1 active:shadow-none mb-4 ${
             tradeMode === 'BUY' ? 'bg-[#00ffa3] text-[#1a1a1a] hover:bg-[#00e692]' : 'bg-[#ff2d55] text-[#F4F1EA] hover:bg-[#e6284d]'
          } disabled:opacity-30 disabled:grayscale`}
       >
          {tradeMode === 'BUY' ? `Buy ${token_symbol || 'Token'}` : `Sell ${token_symbol || 'Token'}`}
       </button>

       <div className="text-center">
          <button 
             onClick={handle_liquidate_all} 
             disabled={portfolio_state.token_holdings_quantity <= 0 || is_price_loading}
             className="text-[10px] uppercase font-bold text-red-800 hover:underline disabled:opacity-30 decoration-double underline-offset-2 tracking-widest opacity-60"
           >
            Liquify Entire Portfolio
          </button>
       </div>
    </div>
  );
}
