export interface NormalizedToken {
  token_address: string;
  token_name: string;
  token_symbol: string;
  token_logo: string | null;
  token_description: string | null;
  priceUsd?: number;
  marketCapUsd?: number;
  bondingProgress?: number;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function normalizeTokenMetadata(raw: any, sourceAddress?: string): NormalizedToken {
  if (!raw) raw = {};
  
  // 1. Resolve Address
  const address = raw.address || raw.tokenAddress || raw.baseToken?.address || sourceAddress || '';

  // 2. Resolve Name
  let rawName = raw.name || raw.baseToken?.name || raw.metadata?.name;
  
  // 3. Resolve Symbol
  let rawSymbol = raw.symbol || raw.baseToken?.symbol || raw.metadata?.symbol;

  const fallbackName = rawSymbol || shortenAddress(address);
  const token_name = rawName ? String(rawName) : fallbackName;
  const token_symbol = rawSymbol ? String(rawSymbol) : 'UNKNOWN';

  // 4. Resolve Logo
  const dexScreenerImage = address ? `https://dd.dexscreener.com/ds-data/tokens/solana/${address}.png` : null;
  let token_logo = raw.logoURI || raw.icon || dexScreenerImage;
  
  if (token_logo && token_logo.startsWith('http')) {
    // valid
  } else {
    token_logo = dexScreenerImage;
  }

  // 5. Resolve Description
  let token_description = raw.description || null;
  if (token_description && (token_description.startsWith('http') || token_description.length < 2)) {
     token_description = null;
  }

  return {
    token_address: address,
    token_name,
    token_symbol,
    token_logo,
    token_description
  };
}
