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

  return (
    <table className="w-full text-sm font-serif border-collapse border-2 border-[#1a1a1a]">
      <thead className="bg-[#1a1a1a] text-[#F4F1EA]">
        <tr className="text-left font-headline tracking-widest text-xs uppercase">
          <th className="p-3 border-r border-[#F4F1EA]">Tx. No.</th>
          <th className="p-3 border-r border-[#F4F1EA]">Action</th>
          <th className="p-3 border-r border-[#F4F1EA]">Market Cap (Entry / Cur)</th>
          <th className="p-3 border-r border-[#F4F1EA]">Position PnL</th>
          <th className="p-3 text-right">Time</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#1a1a1a]">
        {trade_history.map((record, index) => {
          // For BUYS: Performance is (Current - Entry) / Entry
          // For SELLS: Realized performance is (Exited - Last Buy Entry) / Last Buy Entry
          let pnl: number | null = null;
          let comparison_mc = '---';

          if (record.trade_type === 'BUY') {
            if (current_mc) {
              pnl = ((current_mc - record.market_cap_at_trade) / record.market_cap_at_trade) * 100;
              comparison_mc = formatFinancialNumber(current_mc);
            }
          } else {
            // Find the most recent BUY before this SELL to calculate realized PnL
            const previous_buys = trade_history.slice(index + 1).filter(h => h.trade_type === 'BUY');
            if (previous_buys.length > 0) {
              const last_buy = previous_buys[0];
              pnl = ((record.market_cap_at_trade - last_buy.market_cap_at_trade) / last_buy.market_cap_at_trade) * 100;
              comparison_mc = formatFinancialNumber(last_buy.market_cap_at_trade);
            }
          }

          return (
            <tr key={record.trade_id} className="hover:bg-[#eeebe2]">
              <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold">
                {record.trade_id.substring(0, 5)}
              </td>
              <td className={`p-3 border-r border-[#1a1a1a] font-bold uppercase tracking-wider ${record.trade_type === 'BUY' ? 'text-emerald-800' : 'text-red-800'}`}>
                {record.trade_type}
              </td>
              <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs">
                <div className="font-bold">{formatFinancialNumber(record.market_cap_at_trade)}</div>
                <div className="opacity-60 text-[10px]">vs {comparison_mc}</div>
              </td>
              <td className={`p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold ${pnl !== null && pnl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {pnl !== null ? (
                  <span className="flex items-center gap-1">
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                    <span className="text-[10px] opacity-60 font-normal">({record.trade_type === 'BUY' ? 'Unrealized' : 'Realized'})</span>
                  </span>
                ) : (
                  '---'
                )}
              </td>
              <td className="p-3 text-right font-mono text-xs text-[#4a4a4a]">
                {format(new Date(record.execution_timestamp), 'HH:mm:ss')}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

