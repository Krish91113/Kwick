import React, { useState, useRef, useEffect } from 'react';
import { RecentDrop } from '../types';
import { getRecentDrops, clearRecentDrops } from '../utils/storage';
import { getShareByShortCode } from '../services/api';

interface EnterCodeViewProps {
  onOpenRecipientByCode: (code: string) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EnterCodeView: React.FC<EnterCodeViewProps> = ({ onOpenRecipientByCode, onNotify }) => {
  // Support 6-character short-codes (e.g. hUUVTh, TG94EM) and 5-character codes (e.g. K992A)
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [directUrl, setDirectUrl] = useState<string>('');
  const [recentDrops, setRecentDrops] = useState<RecentDrop[]>([]);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolvedPreview, setResolvedPreview] = useState<{
    code: string;
    title: string;
    type: string;
    size: string;
    expiresIn: string;
  } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setRecentDrops(getRecentDrops());
  }, []);

  const fullCode = pin.join('').trim();

  // Auto-resolve when at least 5 or 6 characters are entered
  useEffect(() => {
    let isCancelled = false;

    if (fullCode.length >= 5) {
      setIsResolving(true);
      getShareByShortCode(fullCode)
        .then((share) => {
          if (isCancelled) return;
          setIsResolving(false);
          const sizeStr = share.type === 'text'
            ? `${share.textContent ? new Blob([share.textContent]).size : 0} B`
            : `${((share.file?.sizeBytes || 0) / 1024).toFixed(1)} KB`;

          setResolvedPreview({
            code: share.shortCode,
            title: share.title,
            type: share.type === 'file' ? 'Binary File' : `${share.language || 'Code'} Payload`,
            size: sizeStr,
            expiresIn: 'Verified Payload',
          });
        })
        .catch(() => {
          if (isCancelled) return;
          setIsResolving(false);
          setResolvedPreview(null);
        });
    } else {
      setResolvedPreview(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [fullCode, recentDrops]);

  const handleInputChange = (index: number, value: string) => {
    // Allow letters and numbers, preserving case
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleaned) {
      const next = [...pin];
      next[index] = '';
      setPin(next);
      return;
    }

    // Pasted string (multiple chars)
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((c, i) => {
        next[i] = c;
      });
      setPin(next);
      const targetIndex = Math.min(chars.length, 5);
      inputRefs.current[targetIndex]?.focus();
      return;
    }

    // Single character
    const next = [...pin];
    next[index] = cleaned;
    setPin(next);
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && fullCode.length >= 5) {
      handleOpenDrop();
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text.match(/[#/d/=]([A-Za-z0-9]{4,8})/);
      const code = match ? match[1] : text.replace(/[^a-zA-Z0-9]/g, '');
      if (code) {
        const chars = code.slice(0, 6).split('');
        const next = ['', '', '', '', '', ''];
        chars.forEach((c, i) => {
          next[i] = c;
        });
        setPin(next);
        onNotify(`Pasted code #${code}`, 'info');
      } else {
        onNotify('No valid code found in clipboard', 'error');
      }
    } catch {
      onNotify('Clipboard read permission denied', 'error');
    }
  };

  const handleOpenDrop = () => {
    if (fullCode.length < 5) {
      onNotify('Please enter a 5 or 6-character short-code', 'error');
      return;
    }
    onOpenRecipientByCode(fullCode);
  };

  const handleResolveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = directUrl.trim();
    if (!trimmed) return;

    // Extract short-code from URL (e.g., https://kwickdrop.app/#d=hUUVTh or /#d=K992A) or plain code
    const match = trimmed.match(/[#/d/=]([A-Za-z0-9]{4,8})/);
    const code = match ? match[1] : trimmed.replace(/[^a-zA-Z0-9]/g, '');

    if (code && code.length >= 4) {
      const chars = code.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      chars.forEach((c, i) => {
        next[i] = c;
      });
      setPin(next);
      onOpenRecipientByCode(code);
    } else {
      onNotify('Could not find a valid short-code in that input', 'error');
    }
  };

  const handleClearHistory = () => {
    clearRecentDrops();
    setRecentDrops([]);
    onNotify('Recent session history cleared', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-xs font-mono text-primary-container mb-3">
          <span className="material-symbols-outlined text-[16px]">pin</span>
          <span>PIN Decryption Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          Enter Share Code
        </h1>
        <p className="text-secondary text-sm sm:text-base mt-2 max-w-lg mx-auto">
          Input your 5 or 6-character alphanumeric code or paste a direct link to decrypt and open the payload.
        </p>
      </div>

      {/* Main PIN Input Array */}
      <div className="bg-surface-container-low border border-outline-variant/25 rounded-2xl p-4 sm:p-10 shadow-sm mb-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-md mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
              5 or 6-Character Shortcode
            </span>
            <button
              onClick={handlePasteClipboard}
              className="text-xs font-mono text-primary-container hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">content_paste</span>
              <span>Paste Code</span>
            </button>
          </div>

          {/* 6 Distinct PIN Inputs (supports 5 or 6 chars) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-6 w-full max-w-md">
            {pin.map((char, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={6} // allow paste
                value={char}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="•"
                className={`w-9 h-12 xs:w-11 xs:h-14 sm:w-14 sm:h-20 text-center font-mono text-lg sm:text-3xl font-bold rounded-lg sm:rounded-xl border-2 transition-all focus:outline-none flex-1 max-w-[56px] ${
                  char
                    ? 'border-primary-container bg-surface-container-lowest text-primary shadow-[0_0_15px_rgba(183,243,107,0.15)]'
                    : 'border-outline-variant/30 bg-surface-container-lowest/80 text-on-surface-variant focus:border-primary-container/70'
                }`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Status text */}
          <div className="h-6 flex items-center justify-center font-mono text-xs">
            {isResolving ? (
              <span className="text-primary-container flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                Querying broadcast registry...
              </span>
            ) : resolvedPreview ? (
              <span className="text-primary-container flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Drop verified: {resolvedPreview.title}
              </span>
            ) : fullCode.length >= 5 ? (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">search</span>
                Searching for #{fullCode}...
              </span>
            ) : (
              <span className="text-on-surface-variant/60">
                Tip: Enter the code generated by the sender (e.g. #{pin[0] ? fullCode : 'hUUVTh'})
              </span>
            )}
          </div>

          {/* Instant Resolution Discovery Card */}
          {resolvedPreview && (
            <div className="w-full mt-6 p-4 sm:p-5 rounded-xl bg-surface-container-lowest border border-primary-container/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-primary-container/20 text-primary-container font-semibold">
                      Verified Payload
                    </span>
                    <span className="text-xs font-mono font-bold text-primary">#{resolvedPreview.code}</span>
                  </div>
                  <div className="text-base font-mono font-semibold text-primary truncate max-w-md">
                    {resolvedPreview.title}
                  </div>
                  <div className="text-xs font-mono text-secondary flex items-center gap-2">
                    <span>{resolvedPreview.type}</span>
                    <span>•</span>
                    <span>{resolvedPreview.size}</span>
                    <span>•</span>
                    <span className="text-amber-400">{resolvedPreview.expiresIn}</span>
                  </div>
                </div>

                <button
                  onClick={handleOpenDrop}
                  className="px-6 py-3 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm font-semibold tracking-tight transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Open Drop (Enter)</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternative URL / Direct Code Resolver */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-xl p-5 mb-10">
        <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">
          Or paste direct share code / URL
        </div>
        <form onSubmit={handleResolveUrl} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. hUUVTh or http://localhost:5173/#d=hUUVTh"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-mono text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary-container"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-container/20 hover:bg-primary-container/30 border border-primary-container/40 text-xs font-mono text-primary-container rounded-lg transition-colors cursor-pointer"
          >
            Resolve Drop
          </button>
        </form>
      </div>

      {/* Recent Session History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[18px]">history</span>
            <h2 className="text-sm font-semibold font-mono text-primary">Recent Session Cache</h2>
            <span className="text-xs font-mono text-on-surface-variant">({recentDrops.length})</span>
          </div>

          {recentDrops.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs font-mono text-on-surface-variant hover:text-red-400 transition-colors cursor-pointer"
            >
              Flush Cache
            </button>
          )}
        </div>

        {recentDrops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentDrops.map((drop) => (
              <div
                key={drop.shortCode}
                onClick={() => {
                  if (!drop.isExpired) {
                    const chars = drop.shortCode.split('');
                    const next = ['', '', '', '', '', ''];
                    chars.forEach((c, i) => {
                      next[i] = c;
                    });
                    setPin(next);
                    onOpenRecipientByCode(drop.shortCode);
                  }
                }}
                className={`p-4 rounded-xl border text-left font-mono transition-all ${
                  drop.isExpired
                    ? 'bg-surface-container-lowest/40 border-outline-variant/10 opacity-50 cursor-not-allowed'
                    : 'bg-surface-container-low border-outline-variant/20 hover:border-primary-container/40 hover:bg-surface-container cursor-pointer group'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary group-hover:text-primary-container transition-colors">
                    #{drop.shortCode}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      drop.isExpired
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-primary-container/10 text-primary-container border border-primary-container/20'
                    }`}
                  >
                    {drop.isExpired ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>
                <div className="text-xs text-on-surface font-medium truncate mb-1">
                  {drop.title}
                </div>
                <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                  <span>{drop.sizeFormatted}</span>
                  <span className={drop.isExpired ? 'text-red-400/80' : 'text-amber-400/90'}>
                    {drop.expiresInText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-container-low/40 border border-outline-variant/10 rounded-xl font-mono text-xs text-on-surface-variant">
            No recent drops cached in browser session storage.
          </div>
        )}
      </div>
    </div>
  );
};
