import React, { useState, useEffect } from 'react';

interface TimestampToolProps {
  onCopy?: (text: string) => void;
}

export const TimestampTool: React.FC<TimestampToolProps> = ({ onCopy }) => {
  const [now, setNow] = useState<number>(Date.now());
  const [isLivePaused, setIsLivePaused] = useState(false);

  // Converter 1: Timestamp to Date
  const [tsInput, setTsInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
  // Converter 2: Date to Timestamp
  const [dateInput, setDateInput] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isLivePaused) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isLivePaused]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
    onCopy?.(text);
  };

  // Parsing tsInput
  const parsedTs = (() => {
    const trimmed = tsInput.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (isNaN(num)) return null;

    // Detect seconds vs milliseconds
    // Milliseconds typically > 100000000000 (after 1973)
    const ms = trimmed.length <= 10 ? num * 1000 : num;
    const date = new Date(ms);
    if (isNaN(date.getTime())) return null;

    return {
      date,
      seconds: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      relative: getRelativeTimeString(date.getTime()),
    };
  })();

  // Parsing dateInput
  const parsedDate = (() => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    return {
      seconds: Math.floor(date.getTime() / 1000),
      milliseconds: date.getTime(),
      iso: date.toISOString(),
      utc: date.toUTCString(),
    };
  })();

  function getRelativeTimeString(timeMs: number): string {
    const deltaSeconds = Math.round((timeMs - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const absDiff = Math.abs(deltaSeconds);

    if (absDiff < 60) return rtf.format(deltaSeconds, 'second');
    if (absDiff < 3600) return rtf.format(Math.round(deltaSeconds / 60), 'minute');
    if (absDiff < 86400) return rtf.format(Math.round(deltaSeconds / 3600), 'hour');
    if (absDiff < 2592000) return rtf.format(Math.round(deltaSeconds / 86400), 'day');
    if (absDiff < 31536000) return rtf.format(Math.round(deltaSeconds / 2592000), 'month');
    return rtf.format(Math.round(deltaSeconds / 31536000), 'year');
  }

  const liveSeconds = Math.floor(now / 1000);
  const liveDate = new Date(now);

  return (
    <div className="space-y-6">
      {/* Live Current Timestamp Ticker */}
      <div className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container ${isLivePaused ? 'opacity-0' : 'opacity-75'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isLivePaused ? 'bg-amber-400' : 'bg-primary-container'}`} />
            </span>
            <span className="text-xs uppercase tracking-wider font-mono text-on-surface-variant font-medium">
              Current Epoch Timestamp
            </span>
            {isLivePaused && (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                PAUSED
              </span>
            )}
          </div>
          <button
            onClick={() => setIsLivePaused(!isLivePaused)}
            className="text-xs font-mono text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isLivePaused ? 'play_arrow' : 'pause'}
            </span>
            {isLivePaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-on-surface-variant uppercase">Seconds (Unix Epoch)</div>
              <div className="text-xl font-bold text-primary-container tracking-tight">{liveSeconds}</div>
            </div>
            <button
              onClick={() => copyToClipboard(liveSeconds.toString(), 'live-sec')}
              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"
              title="Copy seconds"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedKey === 'live-sec' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-on-surface-variant uppercase">Milliseconds</div>
              <div className="text-xl font-bold text-on-surface tracking-tight">{now}</div>
            </div>
            <button
              onClick={() => copyToClipboard(now.toString(), 'live-ms')}
              className="p-1.5 hover:bg-surface-container rounded text-on-surface-variant hover:text-primary transition-colors"
              title="Copy milliseconds"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copiedKey === 'live-ms' ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono text-on-surface-variant">
          <span className="bg-surface-container px-2 py-1 rounded">UTC: {liveDate.toUTCString()}</span>
          <span className="bg-surface-container px-2 py-1 rounded">ISO: {liveDate.toISOString()}</span>
        </div>
      </div>

      {/* Grid: Convert Timestamp to Date & Date to Timestamp */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Converter 1: Timestamp -> Human Date */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[18px]">history</span>
              Epoch to Human Date
            </h3>
            <button
              onClick={() => setTsInput(Math.floor(Date.now() / 1000).toString())}
              className="text-[11px] font-mono text-primary-container hover:underline"
            >
              Use Current
            </button>
          </div>

          <label className="text-xs text-on-surface-variant mb-1 font-mono">
            Unix Timestamp (seconds or milliseconds):
          </label>
          <input
            type="text"
            value={tsInput}
            onChange={(e) => setTsInput(e.target.value)}
            placeholder="e.g. 1700000000 or 1700000000000"
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm font-mono text-primary focus:outline-none focus:border-primary-container mb-4"
          />

          {parsedTs ? (
            <div className="space-y-2.5 font-mono text-xs flex-1">
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase">UTC</span>
                  <span className="text-on-surface">{parsedTs.utc}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(parsedTs.utc, 'ts-utc')}
                  className="text-on-surface-variant hover:text-primary-container p-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedKey === 'ts-utc' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase">ISO 8601</span>
                  <span className="text-on-surface">{parsedTs.iso}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(parsedTs.iso, 'ts-iso')}
                  className="text-on-surface-variant hover:text-primary-container p-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedKey === 'ts-iso' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase">Local Time</span>
                  <span className="text-on-surface">{parsedTs.local}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(parsedTs.local, 'ts-local')}
                  className="text-on-surface-variant hover:text-primary-container p-1"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedKey === 'ts-local' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase">Relative</span>
                  <span className="text-primary-container">{parsedTs.relative}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/10 text-xs text-on-surface-variant/60 font-mono text-center flex-1 flex items-center justify-center">
              Enter a valid numeric epoch timestamp
            </div>
          )}
        </div>

        {/* Converter 2: Human Date -> Epoch */}
        <div className="bg-surface-container-low border border-outline-variant/15 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container text-[18px]">calendar_today</span>
              Human Date to Epoch
            </h3>
            <button
              onClick={() => {
                const d = new Date();
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                setDateInput(d.toISOString().slice(0, 16));
              }}
              className="text-[11px] font-mono text-primary-container hover:underline"
            >
              Reset to Now
            </button>
          </div>

          <label className="text-xs text-on-surface-variant mb-1 font-mono">
            Date & Time:
          </label>
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded px-3 py-2 text-sm font-mono text-primary focus:outline-none focus:border-primary-container mb-4 [color-scheme:dark]"
          />

          {parsedDate ? (
            <div className="space-y-2.5 font-mono text-xs flex-1">
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase">Epoch Seconds</span>
                  <span className="text-base font-bold text-primary-container">{parsedDate.seconds}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(parsedDate.seconds.toString(), 'date-sec')}
                  className="p-1 text-on-surface-variant hover:text-primary-container"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedKey === 'date-sec' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase">Epoch Milliseconds</span>
                  <span className="text-base font-bold text-on-surface">{parsedDate.milliseconds}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(parsedDate.milliseconds.toString(), 'date-ms')}
                  className="p-1 text-on-surface-variant hover:text-primary-container"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedKey === 'date-ms' ? 'check' : 'content_copy'}
                  </span>
                </button>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded p-2.5">
                <span className="text-[10px] text-on-surface-variant block uppercase">ISO 8601 Equivalent</span>
                <span className="text-on-surface text-[11px] truncate block">{parsedDate.iso}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface-container-lowest rounded border border-outline-variant/10 text-xs text-on-surface-variant/60 font-mono text-center flex-1 flex items-center justify-center">
              Select or enter a valid date
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
