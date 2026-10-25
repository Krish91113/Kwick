import React, { useState } from 'react';

interface PasswordGeneratorToolProps {
  onToast: (msg: string) => void;
  onShare: (content: string, title: string) => void;
}

export const PasswordGeneratorTool: React.FC<PasswordGeneratorToolProps> = ({ onToast }) => {
  const [length, setLength] = useState<number>(24);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useNumbers, setUseNumbers] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [password, setPassword] = useState<string>(() => generateSecurePassword(24, true, true, true, true));

  function generateSecurePassword(
    len: number,
    upper: boolean,
    lower: boolean,
    nums: boolean,
    syms: boolean
  ): string {
    let charset = '';
    if (upper) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (lower) charset += 'abcdefghijkmnopqrstuvwxyz';
    if (nums) charset += '23456789';
    if (syms) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) return '';

    const randomBytes = new Uint32Array(len);
    window.crypto.getRandomValues(randomBytes);

    let result = '';
    for (let i = 0; i < len; i++) {
      result += charset[randomBytes[i]! % charset.length];
    }
    return result;
  }

  const handleRegenerate = () => {
    const next = generateSecurePassword(length, useUpper, useLower, useNumbers, useSymbols);
    setPassword(next);
    onToast('Generated new entropy password');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    onToast('Password copied to clipboard');
  };

  const charsetSize =
    (useUpper ? 24 : 0) +
    (useLower ? 24 : 0) +
    (useNumbers ? 8 : 0) +
    (useSymbols ? 26 : 0);
  const entropyBits = charsetSize > 0 ? Math.round(length * Math.log2(charsetSize)) : 0;

  return (
    <div className="flex flex-col gap-space-md">
      <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shadow-sm border border-surface-container-high">
            <span className="material-symbols-outlined text-[24px]">shield</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Password &amp; Secret Generator
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                WebCrypto CSPRNG
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Generate non-guessable high-entropy secrets entirely client-side
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={handleRegenerate}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Generate New</span>
          </button>
        </div>
      </div>

      {/* Generated Display */}
      <div className="bg-surface-container-lowest p-space-lg rounded-lg border border-surface-container-high/40 flex flex-col gap-space-md">
        <div className="flex items-center justify-between bg-surface-container-low p-space-md rounded-lg border border-surface-container-high">
          <span className="font-mono text-display-lg sm:text-[28px] font-bold text-primary-container tracking-wider select-all break-all">
            {password || 'Select at least one character set'}
          </span>
          <button
            onClick={handleCopy}
            className="ml-4 p-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer shrink-0"
            title="Copy password"
          >
            <span className="material-symbols-outlined text-[20px]">content_copy</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span>Entropy: <strong className="text-on-surface">{entropyBits} bits</strong></span>
          </div>
          <span className="text-primary-container font-medium">
            {entropyBits >= 120 ? 'Cryptographically Excellent' : entropyBits >= 80 ? 'Strong' : 'Moderate'}
          </span>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-surface-container-lowest p-space-md rounded-lg border border-surface-container-high/40 flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="font-code-sm text-code-sm text-on-surface">Password Length: {length} chars</span>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setLength(val);
              setPassword(generateSecurePassword(val, useUpper, useLower, useNumbers, useSymbols));
            }}
            className="w-48 cursor-pointer accent-primary-container"
          />
        </div>

        <div className="flex flex-wrap items-center gap-space-lg font-code-sm text-code-sm text-on-surface-variant">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => {
                setUseUpper(e.target.checked);
                setPassword(generateSecurePassword(length, e.target.checked, useLower, useNumbers, useSymbols));
              }}
              className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => {
                setUseLower(e.target.checked);
                setPassword(generateSecurePassword(length, useUpper, e.target.checked, useNumbers, useSymbols));
              }}
              className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => {
                setUseNumbers(e.target.checked);
                setPassword(generateSecurePassword(length, useUpper, useLower, e.target.checked, useSymbols));
              }}
              className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => {
                setUseSymbols(e.target.checked);
                setPassword(generateSecurePassword(length, useUpper, useLower, useNumbers, e.target.checked));
              }}
              className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
            />
            <span>Special Symbols (!@#$...)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
