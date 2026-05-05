import React from 'react';
import { ExecutedTradeRecord } from '../../models/types';
import { format } from 'date-fns';
import { formatFinancialNumber } from '../../utils/formatters';

interface HistoryListProps {
  trade_history: ExecutedTradeRecord[];
  current_mc: number | null;
}

export default function HistoryList({ trade_history, current_mc }: HistoryListProps) {
  if (trade_history.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center opacity-20 filter grayscale">
         <div className="text-4xl mb-2">📜</div>
         <div className="font-headline font-black uppercase tracking-[0.2em]">No Transaction History</div>
      </div>
    );
  }

  // Calculate Net Performance for the token
  const total_spent = trade_history.filter(t => t.trade_type === 'BUY').reduce((acc, t) => acc + t.total_usd_value, 0);
  const total_gained = trade_history.filter(t => t.trade_type === 'SELL').reduce((acc, t) => acc + t.total_usd_value, 0);
  const buy_qty = trade_history.filter(t => t.trade_type === 'BUY').reduce((acc, t) => acc + t.trade_quantity, 0);
  const sell_qty = trade_history.filter(t => t.trade_type === 'SELL').reduce((acc, t) => acc + t.trade_quantity, 0);
  const holdings = Math.max(0, buy_qty - sell_qty);

  let unrealized_usd = 0;
  if (holdings > 0 && current_mc && trade_history.length > 0) {
    const latest_buy = trade_history.find(t => t.trade_type === 'BUY');
    if (latest_buy) {
      const current_price = latest_buy.execution_price_usd * (current_mc / latest_buy.market_cap_at_trade);
      unrealized_usd = holdings * current_price;
    }
  }

  const net_pnl_usd = (total_gained + unrealized_usd) - total_spent;
  const net_pnl_pct = total_spent > 0 ? (net_pnl_usd / total_spent) * 100 : 0;

  return (
    <div className="flex flex-col font-sans text-[#1a1a1a]">
      {/* PnL Dashboard Header */}
      <div className="flex flex-col md:flex-row gap-0 border-b-2 border-[#1a1a1a]">
         <div className="bg-[#1a1a1a] text-white p-4 flex flex-col justify-center items-start min-w-[200px]">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Position PNL</span>
            <div className={`text-3xl font-black ${net_pnl_usd >= 0 ? 'text-[#00ffa3]' : 'text-[#ff2d55]'}`}>
               {net_pnl_pct >= 0 ? '+' : ''}{net_pnl_pct.toFixed(2)}%
            </div>
         </div>
         <div className="flex-1 grid grid-cols-2 md:grid-cols-4 bg-white p-4 gap-4">
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase opacity-40">Profit / Loss</span>
               <span className={`text-sm font-bold ${net_pnl_usd >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {net_pnl_usd >= 0 ? '+' : ''}${Math.abs(net_pnl_usd).toFixed(2)}
               </span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase opacity-40">Initial Capital</span>
               <span className="text-sm font-bold">${total_spent.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase opacity-40">Realized</span>
               <span className="text-sm font-bold">${total_gained.toFixed(2)}</span>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-black uppercase opacity-40">Holdings Val.</span>
               <span className="text-sm font-bold">${unrealized_usd.toFixed(2)}</span>
            </div>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#eeebe2] border-b border-[#1a1a1a] font-black uppercase text-[9px] tracking-widest text-[#1a1a1a] opacity-80">
            <tr>
              <th className="p-3 border-r border-[#1a1a1a]">No.</th>
              <th className="p-3 border-r border-[#1a1a1a]">Action</th>
              <th className="p-3 border-r border-[#1a1a1a]">Entry MC / Exit MC</th>
              <th className="p-3 italic">Position Snapshot</th>
              <th className="p-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {trade_history.map((record, index) => {
              let row_pnl_pct: number | null = null;
              let comp_mc = '---';
              
              if (record.trade_type === 'BUY') {
                if (current_mc) {
                  row_pnl_pct = ((current_mc - record.market_cap_at_trade) / record.market_cap_at_trade) * 100;
                  comp_mc = formatFinancialNumber(current_mc);
                }
              } else {
                // Find previous buy for context
                const prev_buys = trade_history.slice(index + 1).filter(t => t.trade_type === 'BUY');
                if (prev_buys.length > 0) {
                  const last_buy = prev_buys[0];
                  row_pnl_pct = ((record.market_cap_at_trade - last_buy.market_cap_at_trade) / last_buy.market_cap_at_trade) * 100;
                  comp_mc = formatFinancialNumber(last_buy.market_cap_at_trade);
                }
              }

              return (
                <tr key={record.trade_id} className="hover:bg-[#f3f2f0] transition-colors bg-white">
                  <td className="p-3 border-r border-[#1a1a1a] font-mono text-[9px] opacity-40">
                    #{trade_history.length - index}
                  </td>
                  <td className={`p-3 border-r border-[#1a1a1a] font-black uppercase tracking-tighter text-[11px] ${record.trade_type === 'BUY' ? 'text-emerald-700' : 'text-pink-600'}`}>
                    {record.trade_type}
                  </td>
                  <td className="p-3 border-r border-[#1a1a1a] font-mono">
                    <div className="flex items-center gap-2">
                       <span className="font-bold">{formatFinancialNumber(record.market_cap_at_trade)}</span>
                       <span className="opacity-20">→</span>
                       <span className="opacity-40">{comp_mc}</span>
                    </div>
                  </td>
                  <td className="p-3 border-r border-[#1a1a1a] font-mono font-bold">
                    {row_pnl_pct !== null ? (
                      <div className="flex items-center gap-1.5">
                         <span className={row_pnl_pct >= 0 ? 'text-emerald-600' : 'text-pink-600'}>
                            {row_pnl_pct >= 0 ? '+' : ''}{row_pnl_pct.toFixed(2)}%
                         </span>
                         <span className="text-[8px] opacity-20 font-black uppercase">
                            ({record.trade_type === 'BUY' ? 'Unrealized' : 'Realized'})
                         </span>
                      </div>
                    ) : '---'}
                  </td>
                  <td className="p-3 text-right font-mono opacity-50 tabular-nums">
                    {format(new Date(record.execution_timestamp), 'HH:mm:ss')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
