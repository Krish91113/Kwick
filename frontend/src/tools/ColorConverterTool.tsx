import React, { useState, useMemo } from 'react';

interface ColorConverterToolProps {
  onCopy?: (text: string) => void;
}

export const ColorConverterTool: React.FC<ColorConverterToolProps> = ({ onCopy }) => {
  const [hexInput, setHexInput] = useState<string>('#B7F36B');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick palette presets
  const presets = [
    { name: 'Signal Lime', hex: '#B7F36B' },
    { name: 'Canvas Dark', hex: '#10131A' },
    { name: 'Container Surface', hex: '#1D2027' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Sky', hex: '#38BDF8' },
    { name: 'Violet', hex: '#8B5CF6' },
    { name: 'Rose', hex: '#FB7185' },
    { name: 'Amber', hex: '#FACC15' },
  ];

  // Parse hex to RGBA
  const colorData = useMemo(() => {
    let clean = hexInput.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;

    // Validate 3, 4, 6, 8 hex digits
    const regex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
    if (!regex.test(clean)) return null;

    let r = 0, g = 0, b = 0, a = 1;
    if (clean.length === 4) {
      r = parseInt(clean[1] + clean[1], 16);
      g = parseInt(clean[2] + clean[2], 16);
      b = parseInt(clean[3] + clean[3], 16);
    } else if (clean.length === 5) {
      r = parseInt(clean[1] + clean[1], 16);
      g = parseInt(clean[2] + clean[2], 16);
      b = parseInt(clean[3] + clean[3], 16);
      a = Math.round((parseInt(clean[4] + clean[4], 16) / 255) * 100) / 100;
    } else if (clean.length === 7) {
      r = parseInt(clean.slice(1, 3), 16);
      g = parseInt(clean.slice(3, 5), 16);
      b = parseInt(clean.slice(5, 7), 16);
    } else if (clean.length === 9) {
      r = parseInt(clean.slice(1, 3), 16);
      g = parseInt(clean.slice(3, 5), 16);
      b = parseInt(clean.slice(5, 7), 16);
      a = Math.round((parseInt(clean.slice(7, 9), 16) / 255) * 100) / 100;
    }

    // Convert to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6;
      } else if (max === gNorm) {
        h = ((bNorm - rNorm) / delta + 2) / 6;
      } else {
        h = ((rNorm - gNorm) / delta + 4) / 6;
      }
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    // Relative luminance for contrast
    const lum = (val: number) => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
    const contrastBlack = (L + 0.05) / 0.05;
    const contrastWhite = 1.05 / (L + 0.05);

    return {
      cleanHex: clean.toUpperCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
      hsl: `hsl(${hDeg}, ${sPct}%, ${lPct}%)`,
      hsla: `hsla(${hDeg}, ${sPct}%, ${lPct}%, ${a})`,
      cssVar: `--color: ${clean.toUpperCase()};`,
      contrastBlack: contrastBlack.toFixed(1) + ':1',
      contrastWhite: contrastWhite.toFixed(1) + ':1',
      isLight: L > 0.5,
      r, g, b, a
    };
  }, [hexInput]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
    onCopy?.(text);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Color Picker */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="color"
                value={colorData?.cleanHex.slice(0, 7) || '#000000'}
                onChange={(e) => setHexInput(e.target.value)}
                className="w-14 h-14 rounded-lg cursor-pointer bg-transparent border-2 border-outline-variant/20 p-0.5"
              />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-1">
                Active Color Hex
              </div>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="#B7F36B"
                className="bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-1.5 text-base font-mono text-primary focus:outline-none focus:border-primary-container uppercase"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-[11px] font-mono text-on-surface-variant mb-2">Palette Presets:</div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.hex}
                  onClick={() => setHexInput(preset.hex)}
                  title={`${preset.name} (${preset.hex})`}
                  style={{ backgroundColor: preset.hex }}
                  className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                    hexInput.toLowerCase() === preset.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-sm'
                      : 'border-outline-variant/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Color Details & Output formats */}
      {colorData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Format values */}
          <div className="space-y-3">
            {[
              { label: 'HEX', val: colorData.cleanHex, key: 'hex' },
              { label: 'RGB', val: colorData.rgb, key: 'rgb' },
              { label: 'RGBA', val: colorData.rgba, key: 'rgba' },
              { label: 'HSL', val: colorData.hsl, key: 'hsl' },
              { label: 'HSLA', val: colorData.hsla, key: 'hsla' },
              { label: 'CSS Custom Property', val: colorData.cssVar, key: 'css' },
            ].map((f) => (
              <div
                key={f.key}
                className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-on-surface-variant uppercase">{f.label}</div>
                  <div className="text-sm font-mono text-primary font-medium">{f.val}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(f.val, f.key)}
                  className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copiedKey === f.key ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>
            ))}
          </div>

          {/* Swatch & Contrast Cards */}
          <div className="space-y-4">
            {/* Big Swatch preview */}
            <div
              className="h-36 rounded-lg border border-outline-variant/20 p-4 flex flex-col justify-between transition-colors shadow-inner"
              style={{ backgroundColor: colorData.cleanHex.slice(0, 7) }}
            >
              <div
                className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded w-max ${
                  colorData.isLight ? 'bg-black/80 text-white' : 'bg-white/80 text-black'
                }`}
              >
                Preview Swatch
              </div>
              <div
                className={`text-lg font-mono font-bold ${
                  colorData.isLight ? 'text-black' : 'text-white'
                }`}
              >
                {colorData.cleanHex}
              </div>
            </div>

            {/* Contrast indicators */}
            <div className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-4 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">
                WCAG Contrast Ratios
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-3">
                  <div className="text-[10px] font-mono text-on-surface-variant">Against White (#FFFFFF)</div>
                  <div className="text-lg font-mono font-bold text-primary mt-1">
                    {colorData.contrastWhite}
                  </div>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-3">
                  <div className="text-[10px] font-mono text-on-surface-variant">Against Black (#000000)</div>
                  <div className="text-lg font-mono font-bold text-primary mt-1">
                    {colorData.contrastBlack}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-surface-container-low border border-outline-variant/15 rounded-lg text-center font-mono text-sm text-red-400">
          Invalid color syntax. Please enter a valid 3, 4, 6, or 8-digit hex code (e.g. #B7F36B).
        </div>
      )}
    </div>
  );
};
