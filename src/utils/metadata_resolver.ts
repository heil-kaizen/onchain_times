import { NormalizedToken } from './token_normalizer';
import { DEFAULT_KEY } from '../services/birdeye_service';

interface CachedMeta {
  name: string;
  symbol: string;
}

const metadataCache: Record<string, CachedMeta> = {};

export async function resolveMissingMetadata(token: NormalizedToken): Promise<NormalizedToken> {
  const needsName = token.token_name.includes('...') || token.token_name === 'UNKNOWN';
  const needsSymbol = token.token_symbol === 'UNKNOWN';

  if (!needsName && !needsSymbol) {
    return token;
  }

  // Check cache
  if (metadataCache[token.token_address]) {
    const cached = metadataCache[token.token_address];
    token.token_name = cached.name;
    token.token_symbol = cached.symbol;
    return token;
  }

  try {
    const apiKey = (import.meta as any).env?.VITE_BIRDEYE_API_KEY || DEFAULT_KEY;
    const res = await fetch(`https://public-api.birdeye.so/defi/v3/token/meta-data/single?address=${token.token_address}`, {
      headers: {
        'x-chain': 'solana',
        'X-API-KEY': apiKey
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.data) {
        const meta = data.data;
        const resolvedName = meta.name ? String(meta.name) : token.token_name;
        const resolvedSymbol = meta.symbol ? String(meta.symbol) : token.token_symbol;
        
        metadataCache[token.token_address] = {
          name: resolvedName,
          symbol: resolvedSymbol
        };

        token.token_name = resolvedName;
        token.token_symbol = resolvedSymbol;
      }
    }
  } catch (err) {
    console.warn(`Failed to resolve metadata for ${token.token_address}`, err);
  }

  return token;
}
