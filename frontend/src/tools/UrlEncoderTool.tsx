import React, { useState } from 'react';

interface UrlEncoderToolProps {
  onToast: (msg: string) => void;
  onShare: (content: string, title: string) => void;
}

export const UrlEncoderTool: React.FC<UrlEncoderToolProps> = ({ onToast, onShare }) => {
  const [input, setInput] = useState<string>('https://example.com/api?query=hello world&filter=category:dev&token=xyz$#123');
  const [output, setOutput] = useState<string>('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const handleExecute = () => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
        onToast('URL encoded');
      } else {
        setOutput(decodeURIComponent(input));
        onToast('URL decoded');
      }
    } catch (e) {
      setOutput(`Error: ${e instanceof Error ? e.message : 'Invalid URI sequence'}`);
      onToast('Failed to parse URL string');
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
            <span className="material-symbols-outlined text-[24px]">link</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                URL Encoder / Decoder
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                RFC 3986
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Percent-encode special URI components or decode query strings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-surface-container-high">
            <button
              onClick={() => setMode('encode')}
              className={`px-space-md py-1 rounded font-code-sm text-code-sm transition-colors cursor-pointer ${
                mode === 'encode'
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Encode
            </button>
            <button
              onClick={() => setMode('decode')}
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
            onClick={() => onShare(output || input, 'url-encoded.txt')}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
            <span className="text-on-surface-variant">Input URI / String</span>
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
            placeholder="Enter URL or text to encode/decode..."
          />
        </div>

        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
            <span className="text-on-surface-variant">Processed Result</span>
            <button
              onClick={handleExecute}
              className="px-space-sm py-0.5 rounded bg-primary-container text-on-primary-container font-semibold cursor-pointer text-code-sm"
            >
              Convert
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
    </div>
  );
};
