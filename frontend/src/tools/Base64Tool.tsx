import React, { useState } from 'react';

interface Base64ToolProps {
  onToast: (msg: string) => void;
  onShare: (content: string, title: string) => void;
}

export const Base64Tool: React.FC<Base64ToolProps> = ({ onToast, onShare }) => {
  const [input, setInput] = useState<string>('Hello, Kwick! Ephemeral developer utilities.');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState<boolean>(false);

  const handleProcess = () => {
    try {
      if (mode === 'encode') {
        let encoded = btoa(unescape(encodeURIComponent(input)));
        if (urlSafe) {
          encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        setOutput(encoded);
        onToast('Encoded to Base64');
      } else {
        let clean = input.trim();
        if (urlSafe) {
          clean = clean.replace(/-/g, '+').replace(/_/g, '/');
          while (clean.length % 4) {
            clean += '=';
          }
        }
        const decoded = decodeURIComponent(escape(atob(clean)));
        setOutput(decoded);
        onToast('Decoded from Base64');
      }
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : 'Invalid Base64 string'}`);
      onToast('Failed to process Base64');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    onToast('Output copied to clipboard');
  };

  return (
    <div className="flex flex-col gap-space-md">
      <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shadow-sm border border-surface-container-high">
            <span className="material-symbols-outlined text-[24px]">find_replace</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Base64 Encoder / Decoder
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                RFC 4648
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Encode raw text to Base64 or decode Base64 payloads back to UTF-8
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-surface-container-high">
            <button
              onClick={() => {
                setMode('encode');
              }}
              className={`px-space-md py-1 rounded font-code-sm text-code-sm transition-colors cursor-pointer ${
                mode === 'encode'
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => {
                setMode('decode');
              }}
              className={`px-space-md py-1 rounded font-code-sm text-code-sm transition-colors cursor-pointer ${
                mode === 'decode'
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Decode
            </button>
          </div>

          <button
            onClick={handleCopy}
            disabled={!output}
            className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm flex items-center gap-1 border border-surface-container-high cursor-pointer disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Copy</span>
          </button>

          <button
            onClick={() => onShare(output || input, 'base64-payload.txt')}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Share Drop</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
        {/* Input */}
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
            <span className="text-on-surface-variant">
              {mode === 'encode' ? 'Plaintext Input' : 'Base64 Input'}
            </span>
            <button
              onClick={() => setInput('')}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer text-code-sm"
            >
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-72 p-space-md bg-surface-container-lowest text-on-surface font-code-md text-code-md resize-none focus:outline-none"
            placeholder={mode === 'encode' ? 'Type or paste plaintext...' : 'Paste Base64 encoded string...'}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
            <span className="text-on-surface-variant">
              {mode === 'encode' ? 'Base64 Result' : 'Decoded Plaintext Result'}
            </span>
            <button
              onClick={handleProcess}
              className="px-space-sm py-0.5 rounded bg-primary-container text-on-primary-container font-semibold cursor-pointer text-code-sm"
            >
              Run {mode === 'encode' ? 'Encode' : 'Decode'}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            className="w-full h-72 p-space-md bg-surface-container-lowest text-on-surface font-code-md text-code-md resize-none focus:outline-none select-all font-mono"
            placeholder="Result will appear here..."
          />
        </div>
      </div>

      <div className="bg-surface-container-low px-space-md py-space-sm rounded-lg flex items-center justify-between border border-surface-container-high/40">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={(e) => setUrlSafe(e.target.checked)}
            className="rounded bg-surface-container text-primary-container w-3.5 h-3.5 cursor-pointer"
          />
          <span className="font-code-sm text-code-sm text-on-surface-variant">
            URL-safe mode (replace + and / with - and _)
          </span>
        </label>
        <button
          onClick={handleProcess}
          className="px-space-md py-1 rounded bg-surface-container-highest text-on-surface font-code-sm text-code-sm hover:bg-surface-container cursor-pointer"
        >
          Execute
        </button>
      </div>
    </div>
  );
};
