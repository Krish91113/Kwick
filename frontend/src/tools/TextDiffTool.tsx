import React, { useState } from 'react';

interface TextDiffToolProps {
  onToast: (msg: string) => void;
  onShare: (content: string, title: string) => void;
}

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export const TextDiffTool: React.FC<TextDiffToolProps> = ({ onToast, onShare }) => {
  const [original, setOriginal] = useState<string>(
`apiVersion: apps/v1
kind: Deployment
metadata:
  name: kwickdrop-edge
spec:
  replicas: 3
  image: kwickdrop/edge:v1.0.0`
  );

  const [modified, setModified] = useState<string>(
`apiVersion: apps/v1
kind: Deployment
metadata:
  name: kwickdrop-edge
spec:
  replicas: 6
  image: kwickdrop/edge:v1.2.0
  resources:
    limits:
      memory: "1024Mi"`
  );

  const computeDiff = (): DiffLine[] => {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    const result: DiffLine[] = [];

    const max = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < max; i++) {
      const o = origLines[i];
      const m = modLines[i];

      if (o === m) {
        if (o !== undefined) result.push({ type: 'same', text: o });
      } else {
        if (o !== undefined && !modLines.includes(o)) {
          result.push({ type: 'removed', text: o });
        }
        if (m !== undefined && !origLines.includes(m)) {
          result.push({ type: 'added', text: m });
        } else if (o !== undefined && modLines.includes(o)) {
          result.push({ type: 'same', text: o });
        }
      }
    }

    return result;
  };

  const diffLines = computeDiff();

  return (
    <div className="flex flex-col gap-space-md">
      <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shadow-sm border border-surface-container-high">
            <span className="material-symbols-outlined text-[24px]">difference</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Text &amp; Code Diff Checker
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                Line-by-Line
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Inspect git-style line additions and removals between two text buffers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => onShare(modified, 'diff-target.yaml')}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Share Diff</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
        {/* Original */}
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
          <div className="px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40 text-on-surface-variant">
            Original Text (Base)
          </div>
          <textarea
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            className="w-full h-48 p-space-md bg-surface-container-lowest text-on-surface font-mono text-code-sm resize-none focus:outline-none"
          />
        </div>

        {/* Modified */}
        <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
          <div className="px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40 text-on-surface-variant">
            Modified Text (Target)
          </div>
          <textarea
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            className="w-full h-48 p-space-md bg-surface-container-lowest text-on-surface font-mono text-code-sm resize-none focus:outline-none"
          />
        </div>
      </div>

      {/* Diff Output */}
      <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
        <div className="px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40 text-on-surface-variant flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <span>Unified Git-Style Diff Output</span>
            <span className="text-primary-container font-mono">+ Additions</span>
            <span className="text-error font-mono">- Deletions</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const diffText = diffLines.map(l => (l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ') + l.text).join('\n');
                navigator.clipboard.writeText(diffText);
                onToast?.('Unified diff copied to clipboard');
              }}
              className="px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-high text-xs font-mono text-on-surface transition-colors cursor-pointer"
            >
              Copy Diff
            </button>
            <button
              onClick={() => {
                const diffText = diffLines.map(l => (l.type === 'added' ? '+ ' : l.type === 'removed' ? '- ' : '  ') + l.text).join('\n');
                onShare?.(diffText, 'patch.diff');
              }}
              className="px-2 py-0.5 rounded bg-primary-container/20 hover:bg-primary-container/30 text-primary-container text-xs font-mono transition-colors cursor-pointer"
            >
              Share Diff
            </button>
          </div>
        </div>
        <div className="p-space-md font-mono text-code-sm max-h-80 overflow-auto select-text leading-relaxed">
          {diffLines.map((line, idx) => (
            <div
              key={idx}
              className={`px-2 py-0.5 rounded ${
                line.type === 'added'
                  ? 'bg-primary-container/15 text-primary-container font-medium'
                  : line.type === 'removed'
                  ? 'bg-error-container/30 text-error font-medium'
                  : 'text-on-surface-variant'
              }`}
            >
              <span className="inline-block w-4 opacity-70">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
