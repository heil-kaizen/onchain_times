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
    return <div className="opacity-50 italic text-center mt-10 uppercase tracking-widest text-[#1a1a1a]">No Records Found In Ledger</div>;
  }

  // Calculate Net Position PnL (for current holdings or total session performance)
  const total_spent = trade_history.filter(t => t.trade_type === 'BUY').reduce((acc, t) => acc + t.total_usd_value, 0);
  const total_gained = trade_history.filter(t => t.trade_type === 'SELL').reduce((acc, t) => acc + t.total_usd_value, 0);
  
  const total_buy_qty = trade_history.filter(t => t.trade_type === 'BUY').reduce((acc, t) => acc + t.trade_quantity, 0);
  const total_sell_qty = trade_history.filter(t => t.trade_type === 'SELL').reduce((acc, t) => acc + t.trade_quantity, 0);
  const current_holdings = Math.max(0, total_buy_qty - total_sell_qty);
  
  // Calculate current value based on the most recent trade's price-to-MC ratio if needed, or just current_price
  // But history has the info. Let's use the current_mc vs entry_mc for current_holdings.
  let current_value = 0;
  if (current_mc && trade_history.length > 0) {
    const latest_ref = trade_history[0];
    const current_price = latest_ref.execution_price_usd * (current_mc / latest_ref.market_cap_at_trade);
    current_value = current_holdings * current_price;
  }
  
  const total_pnl_usd = (total_gained + current_value) - total_spent;
  const total_pnl_pct = total_spent > 0 ? (total_pnl_usd / total_spent) * 100 : 0;

  return (
    <div className="flex flex-col gap-0 border-2 border-[#1a1a1a] font-serif">
      <div className="bg-[#1a1a1a] text-[#F4F1EA] p-3 flex justify-between items-center font-headline uppercase tracking-widest text-xs border-b-2 border-[#1a1a1a]">
         <span>Transaction History</span>
         <div className="flex items-center gap-4">
            <span className="opacity-60">Session Position PnL:</span>
            <span className={`text-[14px] font-black ${total_pnl_pct >= 0 ? 'text-[#00ffa3]' : 'text-[#ff2d55]'}`}>
               {total_pnl_pct >= 0 ? '+' : ''}{total_pnl_pct.toFixed(2)}%
            </span>
         </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left font-headline tracking-widest text-[10px] uppercase bg-[#eeebe2] border-b border-[#1a1a1a]">
              <th className="p-2 border-r border-[#1a1a1a]">No.</th>
              <th className="p-2 border-r border-[#1a1a1a]">Side</th>
              <th className="p-2 border-r border-[#1a1a1a]">Market Cap Comparison</th>
              <th className="p-2 border-r border-[#1a1a1a]">PnL Result</th>
              <th className="p-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a] bg-white text-[#1a1a1a]">
            {trade_history.map((record, index) => {
              let pnl: number | null = null;
              let comparison_mc = '---';

              if (record.trade_type === 'BUY') {
                if (current_mc) {
                  pnl = ((current_mc - record.market_cap_at_trade) / record.market_cap_at_trade) * 100;
                  comparison_mc = formatFinancialNumber(current_mc);
                }
              } else {
                const previous_buys = trade_history.slice(index + 1).filter(h => h.trade_type === 'BUY');
                if (previous_buys.length > 0) {
                  const last_buy = previous_buys[0];
                  pnl = ((record.market_cap_at_trade - last_buy.market_cap_at_trade) / last_buy.market_cap_at_trade) * 100;
                  comparison_mc = formatFinancialNumber(last_buy.market_cap_at_trade);
                }
              }

              return (
                <tr key={record.trade_id} className="hover:bg-[#f9f8f6] group">
                  <td className="p-2 border-r border-[#1a1a1a] font-mono text-[10px] opacity-40">
                    {trade_history.length - index}
                  </td>
                  <td className={`p-2 border-r border-[#1a1a1a] font-bold uppercase tracking-wider text-[11px] ${record.trade_type === 'BUY' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {record.trade_type}
                  </td>
                  <td className="p-2 border-r border-[#1a1a1a] font-mono text-[11px]">
                    <div className="flex flex-col">
                       <span className="font-bold">{formatFinancialNumber(record.market_cap_at_trade)}</span>
                       <span className="text-[9px] opacity-40 leading-none">vs {comparison_mc}</span>
                    </div>
                  </td>
                  <td className={`p-2 border-r border-[#1a1a1a] font-mono text-[11px] font-bold ${pnl !== null && pnl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {pnl !== null ? (
                      <div className="flex flex-col">
                        <span>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</span>
                        <span className="text-[9px] opacity-40 font-normal leading-none uppercase">
                          {record.trade_type === 'BUY' ? 'Unrealized' : 'Realized'}
                        </span>
                      </div>
                    ) : (
                      '---'
                    )}
                  </td>
                  <td className="p-2 text-right font-mono text-[10px] text-[#4a4a4a] opacity-60">
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
