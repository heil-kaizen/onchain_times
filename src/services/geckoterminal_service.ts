import { ExecutedTradeRecord } from '../models/types';

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export async function fetch_ohlc(pool_address: string, timeframe: 'minute' | 'hour' | 'day' = 'minute', limit: number = 200, aggregate: number = 1): Promise<OHLCV[]> {
  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool_address}/ohlcv/${timeframe}?limit=${limit}&aggregate=${aggregate}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`GeckoTerminal API failed with HTTP code ${response.status}`);
    }
    const data = await response.json();
    
    // Transform API -> chart format
    // data.data.attributes.ohlcv_list contains [timestamp, open, high, low, close, volume]
    if (data && data.data && data.data.attributes && data.data.attributes.ohlcv_list) {
      const transformed_candles = data.data.attributes.ohlcv_list.map((candle: any[]) => ({
        time: candle[0], // seconds
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[5])
      }));
      // Sort ascending by time for lightweight-charts and remove strictly duplicate timestamps
      const sorted = transformed_candles.sort((a: OHLCV, b: OHLCV) => a.time - b.time);
      return sorted.filter((item: OHLCV, index: number, array: OHLCV[]) => index === 0 || item.time !== array[index - 1].time);
    }
    
    return [];
  } catch (error) {
    // Suppress strict throwing on silent network / rate limit drops (which occur when navigating rapidly)
    console.warn("fetch_ohlc: Exception occurred during fetch, resolving empty array:", error);
    return [];
  }
}
