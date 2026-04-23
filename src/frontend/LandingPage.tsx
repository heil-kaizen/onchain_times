import React from 'react';

export default function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] p-4 md:p-8 font-serif border-[12px] border-[#1a1a1a] m-4">
      <div className="max-w-5xl mx-auto border-double border-[6px] border-[#1a1a1a] p-4 md:p-8">
        <header className="text-center border-b-4 border-[#1a1a1a] pb-6 mb-8">
          <h1 className="font-masthead text-6xl md:text-8xl lg:text-[7rem] mb-2 leading-none">The Onchain Times</h1>
          <div className="flex justify-between items-center border-t-2 border-b-2 border-[#1a1a1a] py-2 font-headline uppercase text-sm md:text-md px-1 tracking-widest">
            <span>VOL. I ... No. 1</span>
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>PRICE: ONE PENNY</span>
          </div>
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          <article>
            <h2 className="font-headline text-4xl md:text-5xl font-black leading-none mb-4 uppercase">REVOLUTIONARY PAPER TRADING SIMULATOR UNVEILED</h2>
            <p className="font-serif text-lg leading-relaxed mb-4">
              <span className="text-4xl float-left mr-2 font-headline font-bold">I</span>n a stunning turn of events, citizens are now permitted to simulate financial transactions without risking a single dime. The Solana Paper Trader offers an unparalleled opportunity to practice the art of speculation.
            </p>
            <p className="font-serif text-lg leading-relaxed">
              Witness real-time market data sourced directly from the most vibrant technological networks, allowing the common man to track new ventures, emerging pairs, and graduated assets before making their fortunes in the virtual ledgers.
            </p>
          </article>
          <article className="border-t-2 md:border-t-0 md:border-l-2 border-[#1a1a1a] pt-8 md:pt-0 pl-0 md:pl-8 flex flex-col justify-center items-center text-center">
            <div className="border border-[#1a1a1a] p-8 shadow-[6px_6px_0_#1a1a1a] w-full max-w-sm">
              <h3 className="font-headline text-2xl font-bold mb-4 uppercase">Commence Your Journey</h3>
              <p className="mb-8 italic font-serif">Enter the trading floor and behold the simulated markets. Fortunes await the bold!</p>
              <button 
                onClick={onStart} 
                className="bg-[#1a1a1a] text-[#F4F1EA] px-8 py-4 font-headline uppercase tracking-widest text-lg hover:bg-transparent hover:text-[#1a1a1a] transition-colors border-2 border-[#1a1a1a] w-full shadow-[inset_0_0_0_2px_#F4F1EA]"
              >
                Start Trading
              </button>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
