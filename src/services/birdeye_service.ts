import { fetch_ohlc } from './geckoterminal_service';

export interface BirdeyeToken {
  name: string;
  symbol: string;
  logoURI?: string;
  address: string;
  mc?: number;
  v24hUSD?: number;
  liquidity?: number;
}

export const DEFAULT_KEY = "3369a4c0-0f2a-4c25-bb3f-036136da5c62"; // Placeholder/Default public string if available, or just fallback

export async function fetch_birdeye_new_listings(): Promise<BirdeyeToken[]> {
    const apiKey = (import.meta as any).env?.VITE_BIRDEYE_API_KEY || DEFAULT_KEY;
    const url = `https://public-api.birdeye.so/defi/v2/tokens/new_listing`;
    const res = await fetch(url, {
      headers: {
        'x-chain': 'solana',
        'X-API-KEY': apiKey
      }
    });
  if (!res.ok) throw new Error(`BirdEye new listings failed: ${res.status}`);
  const json = await res.json();
  if (json.data && json.data.items) {
    return json.data.items;
  }
  return [];
}

export async function fetch_birdeye_meme_list(): Promise<BirdeyeToken[]> {
  const apiKey = (import.meta as any).env?.VITE_BIRDEYE_API_KEY || DEFAULT_KEY;
  const url = `https://public-api.birdeye.so/defi/v3/token/meme/list`;
  const res = await fetch(url, {
    headers: {
      'x-chain': 'solana',
      'X-API-KEY': apiKey
    }
  });
  if (!res.ok) throw new Error(`BirdEye meme list failed: ${res.status}`);
  const json = await res.json();
  if (json.data && json.data.items) {
    return json.data.items;
  }
  return [];
}

export async function fetch_birdeye_market_data(address: string): Promise<any> {
  const apiKey = (import.meta as any).env?.VITE_BIRDEYE_API_KEY || DEFAULT_KEY;
  const url = `https://public-api.birdeye.so/defi/v3/token/market-data?address=${address}`;
  const res = await fetch(url, {
    headers: {
      'x-chain': 'solana',
      'X-API-KEY': apiKey
    }
  });
  if (!res.ok) throw new Error(`BirdEye market data failed: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function fetch_birdeye_ohlcv(pairAddress: string, timeframe: '1s'|'15s'|'30s'|'1m'|'5m'|'15m'|'1h' = '1m'): Promise<any> {
  const apiKey = (import.meta as any).env?.VITE_BIRDEYE_API_KEY || DEFAULT_KEY;
  
  // map generic timeframe string to BirdEye type payload if slightly different
  const mappedType = timeframe === '1h' ? '1H' : timeframe; 

  const url = `https://public-api.birdeye.so/defi/v3/ohlcv/pair?address=${pairAddress}&type=${mappedType}`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'x-chain': 'solana',
        'X-API-KEY': apiKey
      }
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        console.warn('BirdEye OHLCV returned 401. Falling back to GeckoTerminal...');
        let gtTimeframe: 'minute' | 'hour' | 'day' = 'minute';
        let agg = 1;
        switch (timeframe) {
          case '5m': agg = 5; break;
          case '15m': agg = 15; break;
          case '1h': gtTimeframe = 'hour'; agg = 1; break;
          default: break; // 1s, 15s, 30s, 1m all map to 1m
        }
        return await fetch_ohlc(pairAddress, gtTimeframe, 200, agg);
      }
      throw new Error(`BirdEye OHLCV failed: ${res.status}`);
    }
    
    const json = await res.json();
    if (json.data && json.data.items) {
      // Transform into proper structure and filter out duplicates, ensuring ascending order
      const transformed = json.data.items.map((item: any) => ({
        time: item.unixTime,
        open: item.o,
        high: item.h,
        low: item.l,
        close: item.c
      })).sort((a: any, b: any) => a.time - b.time);
      
      return transformed.filter((item: any, index: number, array: any[]) => index === 0 || item.time !== array[index - 1].time);
    }
  } catch (error) {
    console.warn('BirdEye fetch failed entirely, falling back to GeckoTerminal', error);
    let gtTimeframe: 'minute' | 'hour' | 'day' = 'minute';
    let agg = 1;
    switch (timeframe) {
      case '5m': agg = 5; break;
      case '15m': agg = 15; break;
      case '1h': gtTimeframe = 'hour'; agg = 1; break;
      default: break;
    }
    return await fetch_ohlc(pairAddress, gtTimeframe, 200, agg);
  }
  
  return [];
}
