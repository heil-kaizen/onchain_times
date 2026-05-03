import React, { useState, useEffect } from 'react';
import { 
  fetch_moralis_new_tokens, 
  fetch_moralis_bonding_tokens, 
  fetch_moralis_graduated_tokens 
} from '../services/moralis_service';
import { normalizeTokenMetadata, NormalizedToken } from '../utils/token_normalizer';
import { resolveMissingMetadata } from '../utils/metadata_resolver';
import { formatFinancialNumber } from '../utils/formatters';

export default function AppDashboard({ onBack, onTokenSelect }: { onBack?: () => void, onTokenSelect: (address: string) => void }) {
  const [newPairs, setNewPairs] = useState<NormalizedToken[]>([]);
  const [boosts, setBoosts] = useState<NormalizedToken[]>([]);
  const [memes, setMemes] = useState<NormalizedToken[]>([]);
  const [error_message, set_error_message] = useState<string | null>(null);
  const [is_loading, set_is_loading] = useState<boolean>(false);

  const loadTokens = async () => {
    set_is_loading(true);
    set_error_message(null);
    try {
      const results = await Promise.allSettled([
        fetch_moralis_new_tokens(),
        fetch_moralis_bonding_tokens(),
        fetch_moralis_graduated_tokens()
      ]);
      
      const newT = results[0].status === 'fulfilled' ? results[0].value : [];
      const bondingT = results[1].status === 'fulfilled' ? results[1].value : [];
      const graduatedT = results[2].status === 'fulfilled' ? results[2].value : [];

      // If all failed, show an error
      if (results.every(r => r.status === 'rejected')) {
        const firstErr = (results[0] as PromiseRejectedResult).reason;
        set_error_message(firstErr.message || 'API connection failed');
      }

      setNewPairs(newT);
      setBoosts(bondingT);
      setMemes(graduatedT);
    } catch (err: any) {
      set_error_message(err.message || 'Failed to load tokens');
    } finally {
      set_is_loading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] p-4 md:p-6 font-serif">
      <div className="max-w-7xl mx-auto">
        <header className="border-b-[4px] border-[#1a1a1a] pb-4 mb-6 flex justify-between items-end">
          <div className="flex items-end gap-4">
            {onBack && <button onClick={onBack} className="text-xl hover:underline italic font-serif">← Front Page</button>}
            <h1 className="font-masthead text-4xl md:text-5xl lg:text-6xl pl-4">The Onchain Times</h1>
          </div>
          <div className="text-right font-headline uppercase text-sm border-l-2 border-[#1a1a1a] pl-4">
            <div className="italic text-[#4b4b4b]">Connection: {error_message ? "Interrupted" : "Secure"}</div>
          </div>
        </header>

        <section className="mb-8 relative">
          <div className="flex justify-between items-end mb-4 border-b-2 border-[#1a1a1a] pb-1">
             <h2 className="font-headline text-3xl font-black uppercase tracking-widest">The Morning Markets</h2>
             <div className="flex items-center gap-4">
               {error_message && <span className="text-red-800 text-xs font-bold uppercase italic animate-pulse">!! {error_message}</span>}
               <button 
                  onClick={loadTokens}
                  disabled={is_loading}
                  className="text-xs uppercase font-bold bg-[#1a1a1a] text-[#F4F1EA] px-3 py-1.5 tracking-widest hover:bg-transparent hover:text-[#1a1a1a] border border-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
                >
                  {is_loading ? 'Fetching...' : 'Refresh Latest'}
                </button>
             </div>
          </div>

          {is_loading && (
            <div className="absolute inset-0 bg-[#F4F1EA]/50 z-50 flex items-center justify-center backdrop-blur-[1px]">
              <div className="border-4 border-[#1a1a1a] p-4 bg-[#F4F1EA] shadow-[6px_6px_0_#1a1a1a] font-headline font-bold uppercase tracking-widest animate-bounce">
                Updating Ledgers...
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Pairs */}
            <div className="border border-[#1a1a1a] p-4 bg-[#F4F1EA] shadow-[3px_3px_0_#1a1a1a] flex flex-col h-[600px]">
              <h3 className="font-headline font-bold text-xl mb-3 border-b border-[#1a1a1a] pb-2 text-center uppercase tracking-wider">New Pairs</h3>
              <div className="overflow-y-auto flex-1 pr-2">
                {newPairs.length === 0 ? (
                  <div className="text-center italic opacity-70 mt-8">Awaiting data...</div>
                ) : (
                  <ul className="space-y-3 font-serif text-sm">
                    {newPairs.map((t: any) => (
                      <li key={t.token_address} onClick={() => onTokenSelect(t.token_address)} className="flex flex-col border-b-2 border-dotted border-[#1a1a1a] pb-2 cursor-pointer hover:bg-[#eeebe2] p-2 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img 
                              src={t.token_logo || `https://dd.dexscreener.com/ds-data/tokens/solana/${t.token_address}.png`} 
                              alt={t.token_symbol} 
                              className="w-6 h-6 rounded-full border border-[#1a1a1a] object-cover bg-white shrink-0"
                              onError={(e) => { (e.target as any).src = 'data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="%231a1a1a"/></svg>'; }}
                            />
                            <span className="font-bold truncate">{t.token_name}</span>
                          </div>
                          <span className="bg-[#1a1a1a] text-[#F4F1EA] px-1 py-0.5 text-[9px] tracking-wider uppercase font-headline">New</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono opacity-80">
                          <div>
                            <span className="mr-2">${t.priceUsd?.toFixed(8)}</span>
                            <span>Liq: {formatFinancialNumber(t.liquidityUsd)}</span>
                          </div>
                          <span className="italic">{t.token_symbol}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Graduating */}
            <div className="border border-[#1a1a1a] p-4 bg-[#F4F1EA] shadow-[3px_3px_0_#1a1a1a] flex flex-col h-[600px]">
              <h3 className="font-headline font-bold text-xl mb-3 border-b border-[#1a1a1a] pb-2 text-center uppercase tracking-wider">Graduating</h3>
              <div className="overflow-y-auto flex-1 pr-2">
                {boosts.length === 0 ? (
                  <div className="text-center italic opacity-70 mt-8">Awaiting data...</div>
                ) : (
                  <ul className="space-y-3 font-serif text-sm">
                    {boosts.map((t: any) => (
                      <li key={t.token_address} onClick={() => onTokenSelect(t.token_address)} className="flex flex-col border-b-2 border-dotted border-[#1a1a1a] pb-2 cursor-pointer hover:bg-[#eeebe2] p-2 transition-colors">
                         <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <img 
                              src={t.token_logo || `https://dd.dexscreener.com/ds-data/tokens/solana/${t.token_address}.png`} 
                              alt={t.token_symbol} 
                              className="w-6 h-6 rounded-full border border-[#1a1a1a] object-cover bg-white shrink-0"
                              onError={(e) => { (e.target as any).src = 'data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="%231a1a1a"/></svg>'; }}
                            />
                            <span className="font-bold truncate" title={t.token_name}>{t.token_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold">{t.bondingProgress?.toFixed(1)}%</span>
                            <div className="w-10 h-1.5 bg-gray-200 border border-[#1a1a1a]">
                               <div className="h-full bg-emerald-700" style={{ width: `${t.bondingProgress}%` }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono opacity-80">
                           <div>
                            <span className="mr-2">${t.priceUsd?.toFixed(8)}</span>
                            <span>MC: {formatFinancialNumber(t.marketCapUsd)}</span>
                          </div>
                          <span>{t.token_symbol}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Graduated */}
            <div className="border-4 border-[#1a1a1a] p-4 bg-[#eeebe2] relative shadow-[3px_3px_0_#1a1a1a] flex flex-col h-[600px]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#eeebe2] px-2 font-headline text-xs font-bold uppercase tracking-widest border border-[#1a1a1a]">Active Market</div>
              <h3 className="relative font-headline font-bold text-xl mb-3 border-b border-[#1a1a1a] pb-2 text-center uppercase tracking-wider">
                Graduated
              </h3>
              <div className="overflow-y-auto flex-1 pr-2 mt-2">
                {error_message && <div className="text-center text-red-800 italic mt-4">{error_message}</div>}
                {!error_message && memes.length === 0 ? (
                  <div className="text-center italic opacity-70 mt-8">Awaiting market listings...</div>
                ) : (
                   <ul className="space-y-3 font-serif text-sm">
                    {memes.map((t: any) => (
                      <li key={t.token_address} onClick={() => onTokenSelect(t.token_address)} className="flex flex-col border-b-2 border-dotted border-[#1a1a1a] pb-2 cursor-pointer hover:bg-[#F4F1EA] transition-colors p-2">
                         <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <img 
                              src={t.token_logo || `https://dd.dexscreener.com/ds-data/tokens/solana/${t.token_address}.png`} 
                              alt={t.token_symbol} 
                              className="w-8 h-8 rounded-full border border-[#1a1a1a] object-cover bg-white shrink-0"
                              onError={(e) => { (e.target as any).src = 'data:image/svg+xml;utf8,<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="%231a1a1a"/></svg>'; }}
                            />
                            <span className="font-bold whitespace-normal" title={t.token_name}>{t.token_name}</span>
                          </div>
                          <span className="bg-[#1a1a1a] text-[#F4F1EA] px-2 py-0.5 text-xs tracking-wider uppercase font-headline">Live</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono opacity-80 mt-1 pl-11">
                           <div>
                            <span className="mr-2">${t.priceUsd?.toFixed(8)}</span>
                            <span>MC: {formatFinancialNumber(t.marketCapUsd)}</span>
                          </div>
                          <span className="font-bold">{t.token_symbol}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
