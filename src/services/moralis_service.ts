import { NormalizedToken } from '../utils/token_normalizer';

const BASE_URL = 'https://solana-gateway.moralis.io';
const API_KEY = (import.meta as any).env?.VITE_MORALIS_API_KEY || '';

// Simple cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

async function fetchMoralis(path: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${BASE_URL}${path}${query ? `?${query}` : ''}`;
  
  if (cache.has(url)) {
    const entry = cache.get(url)!;
    if (Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
  }

  if (!API_KEY) {
    throw new Error('Moralis API Key is missing. Please configure VITE_MORALIS_API_KEY in secrets.');
  }

  const response = await fetch(url, {
    headers: {
      'X-Api-Key': API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Moralis API error: ${response.status}`);
  }

  const data = await response.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

export interface MoralisToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  logo?: string;
  priceUsd?: string;
  fullyDilutedValuation?: string;
  liquidity?: string;
  createdAt?: string;
  bondingCurveProgress?: number;
}

export async function fetch_moralis_new_tokens(): Promise<NormalizedToken[]> {
  const data = await fetchMoralis('/token/mainnet/exchange/pumpfun/new', { limit: '50' });
  if (!data || !data.result) return [];
  
  return (data.result as any[]).map(t => ({
    token_address: t.tokenAddress,
    token_name: t.name,
    token_symbol: t.symbol,
    token_logo: t.logo || null,
    token_description: null,
    priceUsd: t.priceUsd ? parseFloat(t.priceUsd) : 0,
    marketCapUsd: t.fullyDilutedValuation ? parseFloat(t.fullyDilutedValuation) : 0,
    liquidityUsd: t.liquidity ? parseFloat(t.liquidity) : 0
  }));
}

export async function fetch_moralis_bonding_tokens(): Promise<NormalizedToken[]> {
  const data = await fetchMoralis('/token/mainnet/exchange/pumpfun/bonding', { limit: '50' });
  if (!data || !data.result) return [];
  
  return (data.result as any[]).map(t => ({
    token_address: t.tokenAddress,
    token_name: t.name,
    token_symbol: t.symbol,
    token_logo: t.logo || null,
    token_description: null,
    bondingProgress: t.bondingCurveProgress,
    priceUsd: t.priceUsd ? parseFloat(t.priceUsd) : 0,
    marketCapUsd: t.fullyDilutedValuation ? parseFloat(t.fullyDilutedValuation) : 0
  }));
}

export async function fetch_moralis_graduated_tokens(): Promise<NormalizedToken[]> {
  const data = await fetchMoralis('/token/mainnet/exchange/pumpfun/graduated', { limit: '50' });
  if (!data || !data.result) return [];
  
  return (data.result as any[]).map(t => ({
    token_address: t.tokenAddress,
    token_name: t.name,
    token_symbol: t.symbol,
    token_logo: t.logo || null,
    token_description: null,
    priceUsd: t.priceUsd ? parseFloat(t.priceUsd) : 0,
    marketCapUsd: t.fullyDilutedValuation ? parseFloat(t.fullyDilutedValuation) : 0
  }));
}

export async function fetch_moralis_metadata(address: string) {
  return await fetchMoralis(`/token/mainnet/${address}/metadata`);
}

export async function fetch_moralis_price(address: string) {
  return await fetchMoralis(`/token/mainnet/${address}/price`);
}

export async function fetch_moralis_ohlcv(pairAddress: string, timeframe: string = '1min') {
  return await fetchMoralis(`/token/mainnet/pairs/${pairAddress}/ohlcv`, {
    timeframe,
    currency: 'usd',
    limit: '200'
  });
}

export async function discover_pair_address(tokenAddress: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddress}`);
    if (!res.ok) return null;
    const pairs = await res.json();
    if (!pairs || pairs.length === 0) return null;
    const bestPair = pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    return bestPair.pairAddress;
  } catch (err) {
    console.error('Pair discovery failed', err);
    return null;
  }
}
