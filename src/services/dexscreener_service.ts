import { TRADING_CONFIG } from "../config/trading_config";

export async function fetch_solana_pair_price(): Promise<number> {
  const url = `https://api.dexscreener.com/latest/dex/tokens/${TRADING_CONFIG.TARGET_TOKEN_ADDRESS}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`DexScreener API lookup failed with HTTP code ${response.status}`);
    }
    const data = await response.json();
    
    // DexScreener returns pairs matching the token. We prefer the SOL quote pair.
    if (data.pairs && data.pairs.length > 0) {
      const sol_pair = data.pairs.find((p: any) => p.quoteToken.symbol === 'SOL');
      if (sol_pair) {
          // priceNative denotes token price in quote token (SOL)
          return parseFloat(sol_pair.priceNative);
      }
      return parseFloat(data.pairs[0].priceNative);
    }
    
    throw new Error('Unrecognized response structure or empty pairs array from DexScreener');
  } catch (error) {
    // We log explicitly here so failing network context isn't lost for debugging
    console.error("fetch_solana_pair_price: Exception occurred during fetch", error);
    throw error;
  }
}

export async function fetch_dexscreener_boosts(): Promise<any[]> {
  try {
    const res = await fetch('https://api.dexscreener.com/token-boosts/top/v1');
    if (!res.ok) throw new Error('Failed to load boosts');
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.filter((p: any) => p.chainId === 'solana');
    }
    return [];
  } catch (error) {
    console.error("fetch_dexscreener_boosts: Error", error);
    return [];
  }
}

export interface TokenProfile {
  chainId: string;
  tokenAddress: string;
  icon: string;
  header: string;
  description: string;
}

export async function fetch_latest_profiles(): Promise<TokenProfile[]> {
  try {
    const res = await fetch('https://api.dexscreener.com/token-profiles/latest/v1');
    if (!res.ok) throw new Error('Failed to load tokens');
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.filter((p: any) => p.chainId === 'solana');
    }
    return [];
  } catch (error) {
    console.error("fetch_latest_profiles: Error", error);
    throw new Error('Failed to load tokens');
  }
}

export async function fetch_token_pair_info(tokenAddress: string): Promise<any> {
  try {
    const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddress}`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    if (data && Array.isArray(data) && data.length > 0) {
      // Sort by liquidity.usd descending to pick highest liquidity pair
      const sorted = data.sort((a: any, b: any) => {
        const liqA = a.liquidity?.usd || 0;
        const liqB = b.liquidity?.usd || 0;
        return liqB - liqA;
      });
      if (sorted.length > 0) return sorted[0];
      return data[0];
    }
    throw new Error('No trading data available');
  } catch (error) {
    console.error("fetch_token_pair_info: Error", error);
    throw new Error('No trading data available');
  }
}
