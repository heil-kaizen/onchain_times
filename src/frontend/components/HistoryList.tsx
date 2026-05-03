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
          <th className="p-3 border-r border-[#F4F1EA]">Entry MC</th>
          <th className="p-3 border-r border-[#F4F1EA]">Current MC</th>
          <th className="p-3 border-r border-[#F4F1EA]">PnL (%)</th>
          <th className="p-3 text-right">Time</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#1a1a1a]">
        {trade_history.map(record => {
          const pnl = current_mc && record.trade_type === 'BUY' 
            ? ((current_mc - record.market_cap_at_trade) / record.market_cap_at_trade) * 100 
            : null;

          return (
            <tr key={record.trade_id} className="hover:bg-[#eeebe2]">
              <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold">
                {record.trade_id.substring(0, 5)}
              </td>
              <td className={`p-3 border-r border-[#1a1a1a] font-bold uppercase tracking-wider ${record.trade_type === 'BUY' ? 'text-emerald-800' : 'text-red-800'}`}>
                {record.trade_type}
              </td>
              <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold">
                {formatFinancialNumber(record.market_cap_at_trade)}
              </td>
              <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs">
                {record.trade_type === 'BUY' ? formatFinancialNumber(current_mc) : 'N/A'}
              </td>
              <td className={`p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold ${pnl && pnl >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {pnl !== null ? `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%` : '---'}
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

