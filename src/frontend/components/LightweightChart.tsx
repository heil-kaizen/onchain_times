import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, createSeriesMarkers, ISeriesMarkersPluginApi } from 'lightweight-charts';
import { ExecutedTradeRecord } from '../../models/types';
import { fetch_moralis_ohlcv } from '../../services/moralis_service';

interface LightweightChartProps {
  poolAddress: string;
  trades: ExecutedTradeRecord[];
  onPriceUpdate?: (price: number) => void;
  symbol?: string;
}

export default function LightweightChart({ poolAddress, trades, onPriceUpdate, symbol }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const [timeframe, setTimeframe] = React.useState<'1min'|'5min'|'15min'|'1h'|'4h'|'1d'>('1min');

  function build_trade_markers(trade_history: ExecutedTradeRecord[]) {
    const sorted = [...trade_history].sort((a, b) => a.execution_timestamp - b.execution_timestamp);
    return sorted.map((trade) => ({
      time: Math.floor(trade.execution_timestamp / 1000) as Time,
      position: (trade.trade_type === 'BUY' ? 'belowBar' : 'aboveBar') as any,
      color: trade.trade_type === 'BUY' ? '#16a34a' : '#dc2626',
      shape: (trade.trade_type === 'BUY' ? 'arrowUp' : 'arrowDown') as any,
      text: trade.trade_type,
    }));
  }

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#F4F1EA' },
        textColor: '#111',
      },
      grid: {
        vertLines: { color: 'rgba(26, 26, 26, 0.1)' },
        horzLines: { color: 'rgba(26, 26, 26, 0.1)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderVisible: false,
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      priceFormat: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
    });

    markersRef.current = createSeriesMarkers(seriesRef.current);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 0);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!poolAddress || !seriesRef.current) return;

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const loadData = async () => {
      try {
        const response = await fetch_moralis_ohlcv(poolAddress, timeframe);
        if (!isMounted) return;
        
        // Moralis structure transformation
        if (response && response.result && Array.isArray(response.result) && seriesRef.current) {
          const transformed = response.result.map((item: any) => ({
            time: Math.floor(new Date(item.timestamp).getTime() / 1000) as Time,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close)
          })).sort((a: any, b: any) => a.time - b.time);
          
          seriesRef.current.setData(transformed as CandlestickData[]);
          
          if (onPriceUpdate && transformed.length > 0) {
            onPriceUpdate(transformed[transformed.length - 1].close);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load Moralis chart data", err);
      }
    };

    loadData();
    intervalId = setInterval(loadData, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [poolAddress, onPriceUpdate, timeframe]);

  useEffect(() => {
    if (markersRef.current) {
      const markers = build_trade_markers(trades);
      markersRef.current.setMarkers(markers as any);
    }
  }, [trades]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        {symbol && <span className="font-headline font-bold text-lg bg-[#F4F1EA] px-2 py-0.5 border border-[#1a1a1a] opacity-80 shadow-[2px_2px_0_#1a1a1a]">{symbol}/USD</span>}
        <div className="flex bg-[#F4F1EA] border border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
          {(['1min', '5min', '15min', '1h', '4h', '1d'] as const).map(tf => (
             <button 
               key={tf}
               onClick={() => setTimeframe(tf as any)}
               className={`px-2 py-1 text-xs font-mono font-bold uppercase transition-colors border-r border-[#1a1a1a] last:border-r-0 ${timeframe === tf ? 'bg-[#1a1a1a] text-[#F4F1EA]' : 'hover:bg-[#eeebe2]'}`}
             >
               {tf.replace('min', 'm')}
             </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-full relative z-0" />
    </div>
  );
}

