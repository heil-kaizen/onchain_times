import React, { useState } from 'react';
import { VirtualPortfolioState } from '../../models/types';
import { Wallet, Settings2, ShieldCheck, Zap } from 'lucide-react';

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
  const [amountInput, setAmountInput] = useState<string>("10");

  const execute_trade = () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0 || !current_price) return;

    if (tradeMode === 'BUY') {
      on_buy(amount);
    } else {
      // In SELL mode, amountInput is treat as USD value if entered manually,
      // but typically we'd want to sell a specific amount of tokens or percentage.
      // We'll keep it as USD for consistency with the input, converting to tokens.
      const tokens_to_sell = amount / current_price;
      on_sell(tokens_to_sell);
    }
  };

  const handle_liquidate_all = () => {
    on_sell(portfolio_state.token_holdings_quantity);
  };

  const is_price_loading = !current_price;
  const parsed_amount = parseFloat(amountInput) || 0;
  
  const is_buy_disabled = is_price_loading || parsed_amount > portfolio_state.solana_wallet_balance || parsed_amount <= 0;
  
  // Calculate tokens to sell based on input USD
  const tokens_calculated = current_price ? parsed_amount / current_price : 0;
  const is_sell_disabled = is_price_loading || tokens_calculated > (portfolio_state.token_holdings_quantity + 0.000001) || tokens_calculated <= 0;

  const current_balance_tokens = portfolio_state.token_holdings_quantity;
  const current_balance_usd = current_price ? current_balance_tokens * current_price : 0;

  const buy_amounts = [10, 50, 100, 200];
  const sell_percentages = [10, 25, 50, 100];

  return (
    <div className="flex flex-col gap-0 font-sans text-[#1a1a1a]">
       {/* Mode Tabs */}
       <div className="grid grid-cols-2 bg-[#1a1a1a] p-1 rounded-lg mb-4">
          <button 
            onClick={() => { setTradeMode('BUY'); setAmountInput("10"); }}
            className={`py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${tradeMode === 'BUY' ? 'bg-[#00ffa3] text-[#1a1a1a]' : 'text-white opacity-60 hover:opacity-100'}`}
          >
            Buy
          </button>
          <button 
            onClick={() => { setTradeMode('SELL'); setAmountInput(current_balance_usd.toFixed(2)); }}
            className={`py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-all ${tradeMode === 'SELL' ? 'bg-[#ff2d55] text-white' : 'text-white opacity-60 hover:opacity-100'}`}
          >
            Sell
          </button>
       </div>

       {/* Order Type Selection */}
       <div className="flex items-center gap-4 mb-4 text-[11px] font-bold uppercase tracking-widest border-b border-[#1a1a1a] pb-1">
          <span className="border-b-2 border-[#1a1a1a] pb-1">Market</span>
          <span className="opacity-30 cursor-not-allowed">Limit</span>
          <span className="opacity-30 cursor-not-allowed">Adv.</span>
          <div className="ml-auto flex items-center gap-1.5 bg-[#eeebe2] px-2 py-0.5 rounded border border-[#1a1a1a] shadow-[1px_1px_0_#1a1a1a]">
             <Wallet size={12} className="opacity-60" />
             <span className="font-mono text-[10px]">${portfolio_state.solana_wallet_balance.toFixed(2)}</span>
          </div>
       </div>

       {/* Input Container */}
       <div className="bg-[#1a1a1a] p-[1px] rounded-lg shadow-[4px_4px_0_#1a1a1a] mb-6">
          <div className="bg-[#eeebe2] rounded-lg p-4">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-black opacity-40">Amount</span>
                <span className="text-[10px] uppercase font-black opacity-40 flex items-center gap-1">
                   <ShieldCheck size={10} /> {tradeMode === 'BUY' ? 'USD' : 'USD EQUIV.'}
                </span>
             </div>
             
             <div className="flex items-center gap-2 mb-4">
                <input 
                   type="text" 
                   value={amountInput} 
                   onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, ''))}
                   className="bg-transparent text-2xl font-mono font-black outline-none w-full"
                   placeholder="0.0"
                />
                <span className="font-black text-xl opacity-20">$</span>
             </div>

             {/* Quick Selection Grid */}
             <div className="grid grid-cols-4 gap-1.5">
                {tradeMode === 'BUY' ? (
                   buy_amounts.map(val => (
                      <button 
                         key={val}
                         onClick={() => setAmountInput(val.toString())}
                         className="bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-black py-1.5 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                      >
                         {val}
                      </button>
                   ))
                ) : (
                   sell_percentages.map(val => (
                      <button 
                         key={val}
                         onClick={() => {
                            if (current_price) {
                               const usd_val = current_balance_usd * (val / 100);
                               setAmountInput(usd_val.toFixed(2));
                            }
                         }}
                         className="bg-white border-2 border-[#1a1a1a] text-[#1a1a1a] text-[11px] font-black py-1.5 hover:bg-[#1a1a1a] hover:text-white transition-colors"
                      >
                         {val}%
                      </button>
                   ))
                )}
                <button className="bg-white border-2 border-[#1a1a1a] flex items-center justify-center p-1 hover:bg-[#1a1a1a] hover:text-white">
                   <Settings2 size={14} />
                </button>
             </div>
          </div>
       </div>

       {/* Transaction Simulation */}
       <div className="text-[10px] space-y-1 mb-6 px-1 font-bold uppercase opacity-60">
          <div className="flex justify-between">
             <span>Estimated Output</span>
             <span>{tokens_calculated.toFixed(2)} {token_symbol}</span>
          </div>
          <div className="flex justify-between">
             <span>Market Price</span>
             <span>${current_price?.toFixed(8) || '---'}</span>
          </div>
          <div className="flex justify-between text-[#1a1a1a] opacity-100 mt-2 border-t border-[#1a1a1a] pt-1 border-dotted">
             <span>Max Balance</span>
             <span>{current_balance_tokens.toFixed(2)} {token_symbol}</span>
          </div>
       </div>

       {/* Primary Call to Action */}
       <button 
          onClick={execute_trade}
          disabled={tradeMode === 'BUY' ? is_buy_disabled : is_sell_disabled}
          className={`group relative overflow-hidden w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg border-2 border-[#1a1a1a] transition-all shadow-[6px_6px_0_#1a1a1a] active:translate-y-1 active:translate-x-1 active:shadow-none mb-4 ${
             tradeMode === 'BUY' ? 'bg-[#00ffa3] text-[#1a1a1a]' : 'bg-[#ff2d55] text-white'
          } disabled:opacity-30 disabled:grayscale`}
       >
          <div className="relative z-10 flex items-center justify-center gap-2">
             {tradeMode === 'BUY' ? 'Buy' : 'Sell'} {token_symbol}
             {tradeMode === 'SELL' && <span className="opacity-60 text-sm">{tokens_calculated.toFixed(2)}</span>}
          </div>
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
       </button>

       <div className="flex justify-center items-center gap-4">
          <button 
             onClick={handle_liquidate_all} 
             disabled={portfolio_state.token_holdings_quantity <= 0}
             className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-700 hover:scale-105 transition-transform disabled:opacity-20"
          >
             <Zap size={12} fill="currentColor" /> Liquify Entire Position
          </button>
       </div>
    </div>
  );
}
