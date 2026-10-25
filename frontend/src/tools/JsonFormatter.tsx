import React, { useState, useEffect } from 'react';

interface JsonFormatterProps {
  onShareJson: (content: string, title: string) => void;
  onToast: (msg: string) => void;
}

export const JsonFormatter: React.FC<JsonFormatterProps> = ({ onShareJson, onToast }) => {
  const [input, setInput] = useState<string>(() => {
    return JSON.stringify(
      {
        service: "kwickdrop-node",
        status: "healthy",
        metadata: {
          node_id: "us-east-cluster-09",
          encrypted: true,
          cipher: "AES-GCM-256",
          ttl_seconds: 3600
        },
        recipients: [
          "dev-alpha@kwickdrop.internal",
          "lead-sec@kwickdrop.internal"
        ],
        checksum: "e3b0c44298fc1c149afbf4c8996fb924",
        byte_length: 4096,
        ephemeral: true,
        client_origin: "127.0.0.1"
      },
      null,
      2
    );
  });

  const [indent, setIndent] = useState<number>(2);
  const [wrap, setWrap] = useState<boolean>(false);
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState<boolean>(true);
  const [validation, setValidation] = useState<{ isValid: boolean; message: string; nodeCount: number }>({
    isValid: true,
    message: 'Valid JSON',
    nodeCount: 18
  });
  const [formattedHtml, setFormattedHtml] = useState<string>('');

  const countNodes = (obj: unknown): number => {
    if (typeof obj !== 'object' || obj === null) return 1;
    let count = 1;
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      count += countNodes((obj as Record<string, unknown>)[key]);
    }
    return count;
  };

  const sortKeys = (obj: unknown): unknown => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  };

  const syntaxHighlight = (json: string): string => {
    const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-primary-container';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-on-surface font-medium';
          } else {
            cls = 'text-secondary font-mono';
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-primary-container font-semibold';
        } else if (/null/.test(match)) {
          cls = 'text-secondary-fixed-dim italic';
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const processJson = (raw: string, currentIndent = indent) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setFormattedHtml('<span class="text-on-surface-variant italic font-code-sm">Editor empty. Enter or paste JSON payload to inspect and format...</span>');
      setValidation({ isValid: true, message: 'Idle', nodeCount: 0 });
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const nodes = countNodes(parsed);
      setValidation({ isValid: true, message: `Valid JSON • ${nodes} nodes`, nodeCount: nodes });

      const formatted = currentIndent === 0
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, currentIndent);

      setFormattedHtml(syntaxHighlight(formatted));
    } catch (err) {
      setValidation({
        isValid: false,
        message: err instanceof Error ? err.message : 'Invalid JSON Syntax',
        nodeCount: 0
      });
      setFormattedHtml(
        `<div class="p-space-sm bg-error-container text-on-error-container rounded font-code-sm text-code-sm"><p class="font-semibold mb-1">JSON Syntax Error</p><p class="opacity-90 font-mono">${
          err instanceof Error ? err.message : 'Syntax error'
        }</p></div>`
      );
    }
  };

  useEffect(() => {
    processJson(input, indent);
  }, [input, indent]);

  const handleIndentChange = (newIndent: number) => {
    setIndent(newIndent);
    try {
      const parsed = JSON.parse(input);
      const updated = newIndent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, newIndent);
      setInput(updated);
    } catch {
      // Keep as-is if invalid
    }
  };

  const handleSort = () => {
    try {
      const parsed = JSON.parse(input);
      const sorted = sortKeys(parsed);
      const updated = indent === 0 ? JSON.stringify(sorted) : JSON.stringify(sorted, null, indent);
      setInput(updated);
      onToast('Keys sorted alphabetically');
    } catch {
      onToast('Cannot sort invalid JSON');
    }
  };

  const handleCopy = () => {
    try {
      const parsed = JSON.parse(input);
      const str = indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      navigator.clipboard.writeText(str);
    } catch {
      navigator.clipboard.writeText(input);
    }
    onToast('Formatted JSON copied to clipboard');
  };

  const handleLoadSample = () => {
    const sample = JSON.stringify(
      {
        kwickdrop_version: "1.4.2",
        cluster: "us-east-cluster-04",
        ephemeral: true,
        ttl_minutes: 1440,
        routes: [
          { path: "/api/v1/shares", rate_limit: "20/hr", e2ee: true },
          { path: "/api/v1/s/:shortCode", rate_limit: "60/min" }
        ],
        crypto: {
          algorithm: "Ed25519",
          key_id: "kd-sec-node-9981"
        }
      },
      null,
      2
    );
    setInput(sample);
    setIndent(2);
    onToast('Sample JSON loaded');
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!autoFormatOnPaste) return;
    const pasted = e.clipboardData.getData('text');
    try {
      const parsed = JSON.parse(pasted);
      e.preventDefault();
      const formatted = indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      setInput(formatted);
      onToast('Auto-formatted on paste');
    } catch {
      // regular paste
    }
  };

  const linesCount = input ? input.split('\n').length : 0;
  const charsCount = input.length;

  return (
    <div className="flex flex-col gap-space-md">
      {/* Tool Header Card */}
      <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shadow-sm border border-surface-container-high">
            <span className="material-symbols-outlined text-[24px]">data_object</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                JSON Formatter &amp; Validator
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                Client-side only • Fast
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              RFC 8259 syntax parsing with syntax tree folding
            </p>
          </div>
        </div>

        {/* Tool Control Clusters */}
        <div className="flex flex-wrap items-center gap-space-xs">
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg shadow-sm border border-surface-container-high">
            <button
              onClick={() => handleIndentChange(2)}
              className={`px-space-sm py-1 rounded font-code-sm text-code-sm transition-colors ${
                indent === 2
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => handleIndentChange(4)}
              className={`px-space-sm py-1 rounded font-code-sm text-code-sm transition-colors ${
                indent === 4
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              4 Spaces
            </button>
            <button
              onClick={() => handleIndentChange(0)}
              className={`px-space-sm py-1 rounded font-code-sm text-code-sm transition-colors ${
                indent === 0
                  ? 'bg-surface-container-highest text-on-surface font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Minify
            </button>
          </div>

          <button
            onClick={handleSort}
            className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm flex items-center gap-1 transition-colors shadow-sm border border-surface-container-high cursor-pointer"
            title="Sort Object Keys"
          >
            <span className="material-symbols-outlined text-[14px]">sort_by_alpha</span>
            <span>Sort Keys</span>
          </button>

          <button
            onClick={() => {
              setInput('');
              onToast('Editor cleared');
            }}
            className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm transition-colors shadow-sm border border-surface-container-high cursor-pointer"
            title="Clear Editor"
          >
            Clear
          </button>

          <button
            onClick={handleCopy}
            className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm flex items-center gap-1 transition-colors shadow-sm border border-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>Copy Output</span>
          </button>

          <button
            onClick={() => onShareJson(input, 'formatted-data.json')}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Share via Kwick</span>
          </button>
        </div>
      </div>

      {/* Split Editor Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
        {/* Left: Raw Input */}
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm border border-surface-container-high/40">
          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Raw Input Payload</span>
            </div>
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                validation.isValid
                  ? 'bg-surface-container text-primary-container'
                  : 'bg-error-container text-on-error-container'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  validation.isValid ? 'bg-primary-container' : 'bg-error'
                }`}
              />
              <span>{validation.message}</span>
            </div>
          </div>

          <div className="relative w-full h-[460px]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              className="w-full h-full p-space-md bg-surface-container-lowest text-on-surface font-code-md text-code-md resize-none focus:outline-none focus:bg-surface selection:bg-primary-container selection:text-on-primary-container leading-relaxed"
              placeholder="Paste or write JSON payload here..."
              spellCheck="false"
            />
          </div>

          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider border-t border-surface-container-high/40">
            <span>
              CHARS: {charsCount.toLocaleString()} | LINES: {linesCount}
            </span>
            <span>UTF-8 ENCODED</span>
          </div>
        </div>

        {/* Right: Formatted Syntax View */}
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm border border-surface-container-high/40">
          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">terminal</span>
              <span>Formatted JSON Syntax View</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleIndentChange(0)}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-code-sm font-code-sm cursor-pointer"
              >
                Minify
              </button>
              <span className="text-secondary-container">/</span>
              <button
                onClick={() => handleIndentChange(2)}
                className="text-on-surface-variant hover:text-on-surface transition-colors text-code-sm font-code-sm cursor-pointer"
              >
                Expand
              </button>
            </div>
          </div>

          <div
            className="relative w-full h-[460px] overflow-auto p-space-md font-code-md text-code-md bg-surface-container-lowest select-text leading-relaxed"
          >
            <pre
              className={`font-code-md text-code-md leading-relaxed ${
                wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
              }`}
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
          </div>

          <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider border-t border-surface-container-high/40">
            <span>
              {validation.isValid ? 'TREE EXPANDED • 0 SYNTAX ERRORS' : 'SYNTAX ERROR DETECTED'}
            </span>
            <span className="text-primary-container font-semibold">100% IN-MEMORY</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Tray */}
      <div className="bg-surface-container-low px-space-md py-space-sm rounded-lg flex flex-wrap items-center justify-between gap-space-md shadow-sm border border-surface-container-high/40">
        <div className="flex flex-wrap items-center gap-space-md">
          <button
            onClick={handleLoadSample}
            className="font-code-sm text-code-sm text-primary-container hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
            <span>Load sample JSON</span>
          </button>
          <span className="text-secondary-container">|</span>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={wrap}
              onChange={(e) => setWrap(e.target.checked)}
              className="rounded bg-surface-container text-primary-container focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="font-code-sm text-code-sm text-on-surface-variant">Wrap long lines</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoFormatOnPaste}
              onChange={(e) => setAutoFormatOnPaste(e.target.checked)}
              className="rounded bg-surface-container text-primary-container focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="font-code-sm text-code-sm text-on-surface-variant">
              Auto-format on paste
            </span>
          </label>
        </div>
        <div className="flex items-center gap-space-xs text-on-surface-variant font-code-sm text-code-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          <span>Zero Remote Network Requests</span>
        </div>
      </div>
    </div>
  );
};
