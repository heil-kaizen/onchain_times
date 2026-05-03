import React, { useState } from 'react';
import { VirtualPortfolioState } from '../../models/types';
import { TRADING_CONFIG } from '../../config/trading_config';

interface TradePanelProps {
  current_price: number | null;
  current_mc: number | null;
  portfolio_state: VirtualPortfolioState;
  on_buy: (spend_usd_amount: number) => void;
  on_sell: (sell_token_quantity: number) => void;
}

export default function TradePanel({ current_price, current_mc, portfolio_state, on_buy, on_sell }: TradePanelProps) {
  const [trade_usd_amount, set_trade_usd_amount] = useState<string>("10");

  const handle_amount_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized_value = e.target.value.replace(/[^0-9.]/g, '');
    set_trade_usd_amount(sanitized_value);
  };

  const execute_buy_click = () => {
    const amount = parseFloat(trade_usd_amount);
    if (!isNaN(amount) && amount > 0) {
      on_buy(amount);
    }
  };

  const handle_liquidate_all = () => {
    on_sell(portfolio_state.token_holdings_quantity);
  };

  const execute_sell_click = () => {
    const usd_amount_desired = parseFloat(trade_usd_amount);
    if (isNaN(usd_amount_desired) || !current_price || current_price <= 0) return;
    
    // Reverse math to allow user to express sell in terms of funds desired
    const token_quantity_required = usd_amount_desired / current_price;
    on_sell(token_quantity_required);
  };

  const is_price_loading = !current_price;
  const parsed_usd_amount = parseFloat(trade_usd_amount) || 0;
  
  const is_buy_disabled = is_price_loading || parsed_usd_amount > portfolio_state.solana_wallet_balance || parsed_usd_amount <= 0;
  
  const estimated_token_amount = current_price ? parsed_usd_amount / current_price : 0;
  const is_sell_disabled = is_price_loading || estimated_token_amount > portfolio_state.token_holdings_quantity || estimated_token_amount <= 0;

  return (
    <div className="flex flex-col gap-4 font-serif">
       <div className="flex flex-col gap-1">
         <label className="text-sm font-bold uppercase tracking-wider border-b border-[#1a1a1a] pb-1">Order Execution</label>
         <select className="bg-transparent border border-[#1a1a1a] text-[#1a1a1a] p-2 w-full outline-none font-mono text-sm mt-1 focus:bg-[#1a1a1a] focus:text-[#F4F1EA]">
           <option>INSTANT SETTLEMENT</option>
         </select>
       </div>

       <div className="flex flex-col gap-1 mt-2">
         <label className="text-sm font-bold uppercase tracking-wider border-b border-[#1a1a1a] pb-1">Capital To Deploy ($)</label>
         <div className="flex items-center gap-2 mt-1">
           <span className="font-headline font-bold text-xl">$</span>
           <input 
              type="text" 
              value={trade_usd_amount} 
              onChange={handle_amount_change}
              className="bg-transparent border border-[#1a1a1a] text-[#1a1a1a] p-2 w-full outline-none font-mono focus:bg-[#1a1a1a] focus:text-[#F4F1EA] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]"
              placeholder="0.00"
           />
         </div>
       </div>

       <div className="grid grid-cols-2 gap-4 mt-4">
         <button 
           onClick={execute_buy_click}
           disabled={is_buy_disabled}
           className="bg-[#1a1a1a] text-[#F4F1EA] border-2 border-[#1a1a1a] py-3 uppercase font-headline font-bold tracking-widest hover:bg-[#065f46] hover:border-[#065f46] disabled:opacity-30 transition-colors shadow-[4px_4px_0_#1a1a1a] active:translate-y-1 active:translate-x-1 active:shadow-none"
         >
           Buy
         </button>
         <button 
           onClick={execute_sell_click}
           disabled={is_sell_disabled}
           className="bg-[#1a1a1a] text-[#F4F1EA] border-2 border-[#1a1a1a] py-3 uppercase font-headline font-bold tracking-widest hover:bg-[#991b1b] hover:border-[#991b1b] disabled:opacity-30 transition-colors shadow-[4px_4px_0_#1a1a1a] active:translate-y-1 active:translate-x-1 active:shadow-none"
         >
           Sell
         </button>
       </div>

       <div className="flex justify-between items-center mt-2 px-1">
          <div className="text-[10px] uppercase font-bold text-[#4a4a4a] opacity-60">Balance: {portfolio_state.token_holdings_quantity.toFixed(2)} tokens</div>
          <button 
            onClick={() => {
              if (current_price && current_price > 0) {
                set_trade_usd_amount((portfolio_state.token_holdings_quantity * current_price).toFixed(2));
              }
            }}
            className="text-[10px] uppercase font-bold bg-[#1a1a1a] text-[#F4F1EA] px-2 py-0.5 rounded hover:bg-[#4a4a4a]"
          >
            Use Max
          </button>
       </div>

       <div className="mt-4 p-3 border-2 border-[#1a1a1a] border-dotted text-xs space-y-2 bg-[#eeebe2] font-mono shadow-inner text-[#4a4a4a]">
         <div className="font-bold border-b border-[#1a1a1a] pb-1 font-serif uppercase tracking-wider text-[#1a1a1a]">Deal Terms:</div>
         <div className="pt-1">Target Entry MC: {current_mc ? `$${(current_mc / 1_000_000).toFixed(2)}M` : '---'}</div>
         <div className="italic font-serif">Note: No slippage simulated in virtual desk.</div>
       </div>

       <div className="text-center mt-2 border-t border-[#1a1a1a] pt-4">
         <button 
            onClick={handle_liquidate_all} 
            disabled={portfolio_state.token_holdings_quantity <= 0 || is_price_loading}
            className="text-xs uppercase font-bold text-red-800 hover:underline disabled:opacity-30 decoration-double underline-offset-4 tracking-widest"
          >
           Liquify Entire Portfolio
         </button>
       </div>
    </div>
  );
}
