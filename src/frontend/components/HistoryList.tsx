import React from 'react';
import { ExecutedTradeRecord } from '../../models/types';
import { format } from 'date-fns';

interface HistoryListProps {
  trade_history: ExecutedTradeRecord[];
}

export default function HistoryList({ trade_history }: HistoryListProps) {
  if (trade_history.length === 0) {
    return <div className="opacity-50 italic text-center mt-10">NO RECORDS FOUND IN LOCAL LEDGER</div>;
  }

  return (
    <table className="w-full text-sm font-serif border-collapse border-2 border-[#1a1a1a]">
      <thead className="bg-[#1a1a1a] text-[#F4F1EA]">
        <tr className="text-left font-headline tracking-widest text-xs uppercase">
          <th className="p-3 border-r border-[#F4F1EA]">Tx. No.</th>
          <th className="p-3 border-r border-[#F4F1EA]">Action</th>
          <th className="p-3 hidden md:table-cell border-r border-[#F4F1EA]">Quantity</th>
          <th className="p-3 border-r border-[#F4F1EA]">Price Paid</th>
          <th className="p-3 text-right">Time</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#1a1a1a]">
        {trade_history.map(record => (
          <tr key={record.trade_id} className="hover:bg-[#eeebe2]">
            <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold">{record.trade_id.substring(0, 5)}...{record.trade_id.substring(record.trade_id.length - 3)}</td>
            <td className={`p-3 border-r border-[#1a1a1a] font-bold uppercase tracking-wider ${record.trade_type === 'BUY' ? 'text-emerald-800' : 'text-red-800'}`}>
              {record.trade_type}
            </td>
            <td className="p-3 hidden md:table-cell border-r border-[#1a1a1a] font-mono text-xs">
              {record.trade_quantity.toExponential(2)} {record.token_symbol}
            </td>
            <td className="p-3 border-r border-[#1a1a1a] font-mono text-xs font-bold">
              {record.execution_price_in_sol.toExponential(4)} SOL
            </td>
            <td className="p-3 text-right font-mono text-xs text-[#4a4a4a]">
              {format(new Date(record.execution_timestamp), 'HH:mm:ss')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
