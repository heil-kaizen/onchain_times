import React, { useState, useEffect } from 'react';
import { fetch_dexscreener_boosts, fetch_latest_profiles, TokenProfile } from '../services/dexscreener_service';
import { fetch_birdeye_new_listings, fetch_birdeye_meme_list, BirdeyeToken } from '../services/birdeye_service';
import { normalizeTokenMetadata, NormalizedToken } from '../utils/token_normalizer';
import { resolveMissingMetadata } from '../utils/metadata_resolver';

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
      const [newP, boosted, graduateds] = await Promise.all([
        fetch_birdeye_new_listings().catch(() => []),
        fetch_dexscreener_boosts().catch(() => []),
        fetch_latest_profiles().catch(() => [])
      ]);
      
      const newPNormalized = newP.map(t => normalizeTokenMetadata(t));
      const boostedNormalized = boosted.map(t => normalizeTokenMetadata(t));
      const graduatedNormalized = graduateds.map(t => normalizeTokenMetadata(t));

      // Resolve missing metadata in parallel
      const fullyResolvedNewP = await Promise.all(newPNormalized.map(t => resolveMissingMetadata(t)));
      const fullyResolvedBoosted = await Promise.all(boostedNormalized.map(t => resolveMissingMetadata(t)));
      const fullyResolvedGraduated = await Promise.all(graduatedNormalized.map(t => resolveMissingMetadata(t)));

      setNewPairs(fullyResolvedNewP);
      setBoosts(fullyResolvedBoosted);
      setMemes(fullyResolvedGraduated);
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
             <button 
                onClick={loadTokens}
                disabled={is_loading}
                className="text-xs uppercase font-bold bg-[#1a1a1a] text-[#F4F1EA] px-3 py-1.5 tracking-widest hover:bg-transparent hover:text-[#1a1a1a] border border-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-1"
              >
                {is_loading ? 'Fetching...' : 'Refresh Latest'}
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New Pairs */}
            <div className="border border-[#1a1a1a] p-4 bg-[#F4F1EA] shadow-[3px_3px_0_#1a1a1a] flex flex-col h-[500px]">
              <h3 className="font-headline font-bold text-xl mb-3 border-b border-[#1a1a1a] pb-2 text-center uppercase tracking-wider">New Pairs</h3>
              <div className="overflow-y-auto flex-1 pr-2">
                {newPairs.length === 0 ? (
                  <div className="text-center italic opacity-70 mt-8">Awaiting data...</div>
                ) : (
                  <ul className="space-y-3 font-serif text-sm">
                    {newPairs.map((t: any) => (
                      <li key={t.token_address} onClick={() => onTokenSelect(t.token_address)} className="flex justify-between items-center border-b-2 border-dotted border-[#1a1a1a] pb-2 cursor-pointer hover:bg-[#eeebe2] p-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {t.token_logo && <img src={t.token_logo} alt={t.token_symbol} className="w-6 h-6 rounded-full border border-[#1a1a1a] object-cover shrink-0" />}
                          <span className="font-bold">{t.token_name}</span>
                        </div>
                        <span className="bg-[#1a1a1a] text-[#F4F1EA] px-2 py-0.5 text-[10px] tracking-wider whitespace-nowrap ml-2">View</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Graduating */}
            <div className="border border-[#1a1a1a] p-4 bg-[#F4F1EA] shadow-[3px_3px_0_#1a1a1a] flex flex-col h-[500px]">
              <h3 className="font-headline font-bold text-xl mb-3 border-b border-[#1a1a1a] pb-2 text-center uppercase tracking-wider">Graduating</h3>
              <div className="overflow-y-auto flex-1 pr-2">
                {boosts.length === 0 ? (
                  <div className="text-center italic opacity-70 mt-8">Awaiting data...</div>
                ) : (
                  <ul className="space-y-3 font-serif text-sm">
                    {boosts.map((t: any) => (
                      <li key={t.token_address} onClick={() => onTokenSelect(t.token_address)} className="flex justify-between items-center border-b-2 border-dotted border-[#1a1a1a] pb-2 cursor-pointer hover:bg-[#eeebe2] p-1">
                         <div className="flex items-center gap-2 overflow-hidden">
                          <img 
                            src={t.token_logo || `https://dd.dexscreener.com/ds-data/tokens/solana/${t.token_address}.png`} 
                            alt={t.token_symbol} 
                            className="w-6 h-6 rounded-full border border-[#1a1a1a] object-cover bg-white shrink-0"
                            onError={(e) => { (e.target as any).src = 'data:image/svg+xml;utf8,<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="%231a1a1a"/></svg>'; }}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold" title={t.token_name}>
                              {t.token_name}
                            </span>
                            <span className="text-[10px] opacity-70">{t.token_address.substring(0,8)}...</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end ml-2 shrink-0">
                          <span className="text-[10px] text-gray-500">{t.token_symbol}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {/* Graduated */}
            <div className="border-4 border-[#1a1a1a] p-4 bg-[#eeebe2] relative shadow-[3px_3px_0_#1a1a1a] flex flex-col h-[500px]">
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
                      <li key={t.token_address} onClick={() => onTokenSelect(t.token_address)} className="flex justify-between items-center border-b-2 border-dotted border-[#1a1a1a] pb-2 cursor-pointer hover:bg-[#F4F1EA] transition-colors p-2">
                         <div className="flex items-center gap-3 overflow-hidden">
                          <img 
                            src={t.token_logo || `https://dd.dexscreener.com/ds-data/tokens/solana/${t.token_address}.png`} 
                            alt={t.token_symbol} 
                            className="w-8 h-8 rounded-full border border-[#1a1a1a] object-cover bg-white shrink-0"
                            onError={(e) => { (e.target as any).src = 'data:image/svg+xml;utf8,<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="%231a1a1a"/></svg>'; }}
                          />
                          <div className="flex flex-col">
                            <span className="font-bold whitespace-normal" title={t.token_name}>
                              {t.token_name}
                            </span>
                            <span className="text-[10px] opacity-80">{t.token_address.substring(0,8)}...</span>
                          </div>
                        </div>
                        <span className="bg-[#1a1a1a] text-[#F4F1EA] px-2 py-0.5 text-xs tracking-wider whitespace-nowrap ml-2 shrink-0">View &rarr;</span>
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
