import React, { useState } from 'react';

interface UuidToolProps {
  onToast: (msg: string) => void;
  onShare: (content: string, title: string) => void;
}

export const UuidTool: React.FC<UuidToolProps> = ({ onToast, onShare }) => {
  const [count, setCount] = useState<number>(5);
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [hyphens, setHyphens] = useState<boolean>(true);
  const [uuids, setUuids] = useState<string[]>(() => generateBatch(5, false, true));

  function generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function generateBatch(qty: number, isUpper: boolean, hasHyphens: boolean): string[] {
    const list: string[] = [];
    for (let i = 0; i < qty; i++) {
      let u = generateUuid();
      if (!hasHyphens) u = u.replace(/-/g, '');
      if (isUpper) u = u.toUpperCase();
      list.push(u);
    }
    return list;
  }

  const handleRegenerate = () => {
    const fresh = generateBatch(count, uppercase, hyphens);
    setUuids(fresh);
    onToast(`Generated ${count} UUIDs`);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    onToast('All UUIDs copied to clipboard');
  };

  const handleCopyOne = (u: string) => {
    navigator.clipboard.writeText(u);
    onToast(`Copied ${u}`);
  };

  return (
    <div className="flex flex-col gap-space-md">
      <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shadow-sm border border-surface-container-high">
            <span className="material-symbols-outlined text-[24px]">fingerprint</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                UUID / GUID Generator
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                RFC 4122 v4
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Generate cryptographically random v4 Universally Unique Identifiers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={handleRegenerate}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Regenerate</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm flex items-center gap-1 border border-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Copy All</span>
          </button>

          <button
            onClick={() => onShare(uuids.join('\n'), 'uuids.txt')}
            className="px-space-md py-1 rounded bg-surface-container text-on-surface font-code-sm text-code-sm font-semibold flex items-center gap-1 border border-surface-container-high hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-container-lowest p-space-md rounded-lg flex flex-wrap items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <label className="flex items-center gap-2 font-code-sm text-code-sm text-on-surface-variant">
            <span>Quantity:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-16 px-space-xs py-1 rounded bg-surface-container text-on-surface text-center font-mono border border-surface-container-high focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => {
                setUppercase(e.target.checked);
                setUuids(uuids.map(u => e.target.checked ? u.toUpperCase() : u.toLowerCase()));
              }}
              className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
            />
            <span className="font-code-sm text-code-sm text-on-surface-variant">Uppercase</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hyphens}
              onChange={(e) => {
                setHyphens(e.target.checked);
                handleRegenerate();
              }}
              className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
            />
            <span className="font-code-sm text-code-sm text-on-surface-variant">Include Hyphens</span>
          </label>
        </div>

        <span className="font-code-sm text-code-sm text-primary-container">
          Entropy: 122 bits per identifier
        </span>
      </div>

      {/* UUID list */}
      <div className="flex flex-col gap-1.5 bg-surface-container-lowest p-space-md rounded-lg border border-surface-container-high/40">
        {uuids.map((u, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors group"
          >
            <div className="flex items-center gap-space-sm font-mono text-on-surface text-code-md">
              <span className="text-on-surface-variant text-code-sm opacity-50 w-6">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <span className="select-all">{u}</span>
            </div>
            <button
              onClick={() => handleCopyOne(u)}
              className="text-on-surface-variant hover:text-primary-container cursor-pointer p-1 rounded transition-colors"
              title="Copy this UUID"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
