import React from 'react';
import { Siren, PhoneCall, ShieldAlert } from 'lucide-react';

interface HomeEmergencyCardProps {
  onOpenEmergencySheet: () => void;
  isSheetOpen?: boolean;
}

export const HomeEmergencyCard: React.FC<HomeEmergencyCardProps> = ({
  onOpenEmergencySheet,
  isSheetOpen = false,
}) => {
  return (
    <section className="w-full">
      <button
        type="button"
        onClick={onOpenEmergencySheet}
        aria-label="Open emergency help options"
        aria-expanded={isSheetOpen}
        className={`w-full text-left bg-gradient-to-r from-[#ba1a1a] via-[#a31515] to-[#8c1d18] text-white rounded-[20px] p-4 shadow-[0px_8px_24px_rgba(186,26,26,0.22)] border border-[#ffdad6]/30 flex items-center justify-between gap-4 transition-all duration-300 active:scale-[0.98] cursor-pointer min-h-[64px] focus:outline-none focus:ring-4 focus:ring-[#ffdad6] ${
          !isSheetOpen ? 'animate-pulse-glow ring-4 ring-[#ffdad6]/50 hover:ring-[#ffdad6]/80' : 'ring-2 ring-white/40'
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
            <Siren className="w-6 h-6 animate-pulse text-white" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-wide">Emergency help</span>
              <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-semibold uppercase tracking-wider border border-white/25 shrink-0">
                24/7 Priority
              </span>
            </div>
            <p className="text-xs text-white/90 truncate font-medium mt-0.5">
              Call emergency services or alert the hospital
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-[#ffdad6] font-medium">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Use only during an emergency</span>
            </div>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/30 text-white hover:bg-white/25 transition-colors">
          <PhoneCall className="w-5 h-5" />
        </div>
      </button>
    </section>
  );
};
