import React, { useState, useEffect } from 'react';
import { ActiveTab } from '../types';
import { checkBackendHealth } from '../services/api';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenHowItWorks?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onOpenHowItWorks }) => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkBackendHealth().then((health) => {
      setIsBackendHealthy(health !== null);
    });
  }, []);

  const handleTabClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  const handleHowItWorksClick = () => {
    setMobileMenuOpen(false);
    if (onOpenHowItWorks) {
      onOpenHowItWorks();
    } else {
      onSelectTab('how-it-works');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#10131A]/95 backdrop-blur-md border-b border-[#2C303B]/60 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand & API Health */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => handleTabClick('share')}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#B7F36B] flex items-center justify-center text-[#10131A] shadow-[0_0_12px_rgba(183,243,107,0.3)] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px] font-bold">bolt</span>
              </div>
              <span className="font-mono text-lg font-bold tracking-tight text-[#FDFFF1] group-hover:text-[#B7F36B] transition-colors">
                Kwick
              </span>
            </button>
          </div>

          {/* Desktop Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[#13161F] border border-[#2C303B]/80">
            <button
              onClick={() => handleTabClick('share')}
              className={`px-3.5 py-1.5 transition-all rounded-lg font-mono text-xs cursor-pointer ${
                activeTab === 'share'
                  ? 'bg-[#222631] text-[#FDFFF1] font-semibold shadow-sm border border-[#2C303B]'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              Share Drop
            </button>
            <button
              onClick={() => handleTabClick('enter-code')}
              className={`px-3.5 py-1.5 transition-all rounded-lg font-mono text-xs cursor-pointer ${
                activeTab === 'enter-code'
                  ? 'bg-[#222631] text-[#FDFFF1] font-semibold shadow-sm border border-[#2C303B]'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              Enter Code
            </button>
            <button
              onClick={() => handleTabClick('tools')}
              className={`px-3.5 py-1.5 transition-all rounded-lg font-mono text-xs cursor-pointer ${
                activeTab === 'tools'
                  ? 'bg-[#222631] text-[#FDFFF1] font-semibold shadow-sm border border-[#2C303B]'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              Developer Tools
            </button>
            <button
              onClick={handleHowItWorksClick}
              className={`px-3.5 py-1.5 transition-all rounded-lg font-mono text-xs cursor-pointer ${
                activeTab === 'how-it-works'
                  ? 'bg-[#222631] text-[#FDFFF1] font-semibold shadow-sm border border-[#2C303B]'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              How It Works
            </button>
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-2">
            {/* Quick Action Button */}
            <button
              onClick={() => handleTabClick(activeTab === 'enter-code' ? 'share' : 'enter-code')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] font-mono text-xs font-semibold active:scale-95 transition-all shadow-[0_0_10px_rgba(183,243,107,0.2)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                {activeTab === 'enter-code' ? 'send' : 'pin'}
              </span>
              <span>{activeTab === 'enter-code' ? 'New Drop' : 'Enter Code'}</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-lg bg-[#1A1D26] border border-[#2C303B] flex items-center justify-center text-[#FDFFF1] hover:bg-[#222631] transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#2C303B] bg-[#10131A] px-4 py-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => handleTabClick('share')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-sm text-left transition-colors ${
                activeTab === 'share'
                  ? 'bg-[#B7F36B]/15 text-[#B7F36B] font-semibold border border-[#B7F36B]/30'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Share Text or File</span>
            </button>

            <button
              onClick={() => handleTabClick('enter-code')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-sm text-left transition-colors ${
                activeTab === 'enter-code'
                  ? 'bg-[#B7F36B]/15 text-[#B7F36B] font-semibold border border-[#B7F36B]/30'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">pin</span>
              <span>Enter Code (Receive)</span>
            </button>

            <button
              onClick={() => handleTabClick('tools')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-sm text-left transition-colors ${
                activeTab === 'tools'
                  ? 'bg-[#B7F36B]/15 text-[#B7F36B] font-semibold border border-[#B7F36B]/30'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              <span>Developer Tools</span>
            </button>

            <button
              onClick={handleHowItWorksClick}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-mono text-sm text-left transition-colors ${
                activeTab === 'how-it-works'
                  ? 'bg-[#B7F36B]/15 text-[#B7F36B] font-semibold border border-[#B7F36B]/30'
                  : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">help</span>
              <span>How It Works</span>
            </button>
          </div>
        )}
      </header>

      {/* Mobile Floating Bottom Bar for Ultra-Quick Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#10131A]/95 backdrop-blur-md border-t border-[#2C303B]/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
        <button
          onClick={() => handleTabClick('share')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors ${
            activeTab === 'share'
              ? 'text-[#B7F36B] font-bold'
              : 'text-[#A6ABB9] hover:text-[#FDFFF1]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          <span>Share</span>
        </button>

        <button
          onClick={() => handleTabClick('enter-code')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors ${
            activeTab === 'enter-code'
              ? 'text-[#B7F36B] font-bold'
              : 'text-[#A6ABB9] hover:text-[#FDFFF1]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">pin</span>
          <span>Receive</span>
        </button>

        <button
          onClick={() => handleTabClick('tools')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors ${
            activeTab === 'tools'
              ? 'text-[#B7F36B] font-bold'
              : 'text-[#A6ABB9] hover:text-[#FDFFF1]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">terminal</span>
          <span>Tools</span>
        </button>

        <button
          onClick={handleHowItWorksClick}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-mono transition-colors ${
            activeTab === 'how-it-works'
              ? 'text-[#B7F36B] font-bold'
              : 'text-[#A6ABB9] hover:text-[#FDFFF1]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
          <span>About</span>
        </button>
      </nav>
    </>
  );
};
