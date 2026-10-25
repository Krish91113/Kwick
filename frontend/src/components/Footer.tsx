import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0D0F15] mt-auto border-t border-[#2C303B]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[#A6ABB9]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#B7F36B] flex items-center justify-center text-[#10131A] font-bold">
            <span className="material-symbols-outlined text-[16px]">bolt</span>
          </div>
          <span className="text-[#FDFFF1] font-semibold">Kwick</span>
          <span className="text-[#2C303B]">|</span>
          <span>Drop it. Scan it. Share it.</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#A6ABB9]/80">
          <span>Ephemeral by default</span>
          <span>•</span>
          <span>No tracking</span>
          <span>•</span>
          <span>No account required</span>
          <span>•</span>
          <span className="text-[#FDFFF1]">Built by Krish</span>
        </div>
      </div>
    </footer>
  );
};
