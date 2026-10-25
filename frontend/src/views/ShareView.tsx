import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { TtlOption, ShareItem, RecentDrop } from '../types';
import { saveRecentDrop } from '../utils/storage';
import { createTextShare, createFileShare } from '../services/api';

interface ShareViewProps {
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onOpenRecipient: (share: ShareItem) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({ onNotify, onOpenRecipient }) => {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [wrapLines, setWrapLines] = useState(true);
  const [ttl, setTtl] = useState<TtlOption>('24h');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File drop state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Broadcast State - starts clean (null) until user broadcasts!
  const [activeShare, setActiveShare] = useState<ShareItem | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate QR code when activeShare changes
  useEffect(() => {
    if (activeShare?.shareUrl) {
      QRCode.toDataURL(activeShare.shareUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#10131A',
          light: '#FDFFF1',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [activeShare]);

  // Compute text editor metrics
  const linesCount = content ? content.split('\n').length : 1;
  const charsCount = content.length;
  const bytesCount = new Blob([content]).size;

  const handleBroadcast = async () => {
    if (mode === 'text' && !content.trim()) {
      onNotify('Please enter some text or code to share', 'error');
      return;
    }
    if (mode === 'file' && !selectedFile) {
      onNotify('Please choose a file to drop', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let createdShare: ShareItem;

      if (mode === 'text') {
        createdShare = await createTextShare({
          title: title.trim() || 'Untitled Drop',
          textContent: content,
          language,
          expiresIn: ttl,
        });
      } else {
        createdShare = await createFileShare(selectedFile!, {
          title: title.trim() || selectedFile!.name,
          expiresIn: ttl,
        });
      }

      setActiveShare(createdShare);

      // Save to recent drops
      const recent: RecentDrop = {
        shortCode: createdShare.shortCode,
        title: createdShare.title,
        type: createdShare.type,
        sizeFormatted:
          createdShare.type === 'text'
            ? `${bytesCount < 1024 ? bytesCount + ' B' : (bytesCount / 1024).toFixed(1) + ' KB'}`
            : `${((createdShare.file?.sizeBytes || 0) / 1024).toFixed(1)} KB`,
        expiresInText: `Expires in ${ttl}`,
        isExpired: false,
        timestamp: Date.now(),
      };
      saveRecentDrop(recent);

      onNotify(`Drop broadcasted! Shortcode: #${createdShare.shortCode}`, 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to create drop. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
        onNotify('Pasted content from clipboard', 'info');
      }
    } catch {
      onNotify('Clipboard read permission denied', 'error');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.size > 10 * 1024 * 1024) {
        onNotify('File exceeds 10 MB limit', 'error');
        return;
      }
      setSelectedFile(f);
      if (!title) setTitle(f.name);
    }
  };

  const copyText = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    onNotify(`Copied ${label} to clipboard!`, 'info');
  };

  const resetForNewDrop = () => {
    setActiveShare(null);
    setSelectedFile(null);
    setContent('');
    setTitle('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Page Title & Tagline */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase bg-[#B7F36B]/15 text-[#B7F36B] border border-[#B7F36B]/30 font-semibold">
            Ephemeral Transmission
          </span>
          <span className="text-[#A6ABB9] text-xs font-mono">• No login required • Auto-scrubbed</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#FDFFF1]">
          Drop it. Scan it. Share it.
        </h1>
        <p className="text-[#A6ABB9] text-xs sm:text-sm mt-1.5 max-w-2xl">
          Zero-retention temporary sharing. Paste code snippets or drop files up to 10 MB. Encrypted and auto-scrubbed on expiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Drop Workspace (Editor / File Upload) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="bg-[#1A1D26] border border-[#2C303B] rounded-2xl overflow-hidden shadow-sm">
            {/* Mode Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#2C303B] bg-[#13161F] px-3 sm:px-4 py-2.5 gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMode('text')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    mode === 'text'
                      ? 'bg-[#222631] text-[#FDFFF1] font-semibold border border-[#2C303B]'
                      : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">code</span>
                  <span>Paste Text / Code</span>
                </button>
                <button
                  onClick={() => setMode('file')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                    mode === 'file'
                      ? 'bg-[#222631] text-[#FDFFF1] font-semibold border border-[#2C303B]'
                      : 'text-[#A6ABB9] hover:text-[#FDFFF1] hover:bg-[#1A1D26]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">attach_file</span>
                  <span>Upload File</span>
                </button>
              </div>

              {/* Auxiliary actions in text mode */}
              {mode === 'text' && (
                <div className="flex items-center gap-2 text-xs font-mono text-[#A6ABB9]">
                  <button
                    onClick={handlePasteClipboard}
                    className="hover:text-[#FDFFF1] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Paste from system clipboard"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_paste</span>
                    <span className="hidden xs:inline">Paste</span>
                  </button>
                  <span className="text-[#2C303B]">|</span>
                  <button
                    onClick={() => setWrapLines(!wrapLines)}
                    className={`hover:text-[#FDFFF1] transition-colors flex items-center gap-1 cursor-pointer ${
                      wrapLines ? 'text-[#B7F36B]' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">wrap_text</span>
                    <span>Wrap: {wrapLines ? 'On' : 'Off'}</span>
                  </button>
                  <span className="text-[#2C303B]">|</span>
                  <button
                    onClick={() => setContent('')}
                    className="hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Drop Title & Language Selector */}
            <div className="p-3 sm:p-4 border-b border-[#2C303B] bg-[#161922] flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <input
                type="text"
                placeholder={
                  mode === 'text'
                    ? 'Drop title or filename (e.g. nginx-routing.conf)'
                    : 'File title / description (optional)'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-[#10131A] border border-[#2C303B] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-[#FDFFF1] placeholder-[#A6ABB9]/50 focus:outline-none focus:border-[#B7F36B]"
              />

              {mode === 'text' && (
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#10131A] border border-[#2C303B] rounded-xl px-3 py-2 text-xs font-mono text-[#FDFFF1] focus:outline-none focus:border-[#B7F36B] cursor-pointer"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML / YML</option>
                  <option value="markdown">Markdown</option>
                  <option value="python">Python</option>
                  <option value="bash">Bash / Shell</option>
                  <option value="sql">SQL</option>
                  <option value="plaintext">Plain Text</option>
                </select>
              )}
            </div>

            {/* Workspace Area */}
            {mode === 'text' ? (
              <div className="flex bg-[#10131A] min-h-[320px] max-h-[500px] overflow-hidden">
                {/* Gutter with line numbers (hidden on tiny mobile viewports) */}
                <div className="hidden sm:block select-none py-3 px-2.5 text-right font-mono text-[11px] leading-[20px] text-[#A6ABB9]/30 border-r border-[#2C303B] bg-[#10131A] w-12 flex-shrink-0">
                  {Array.from({ length: Math.min(linesCount, 150) }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Main Code Area */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`// Paste your code or secret payload here...\n// Kwick creates an instant short-code and QR vector.\n// Auto-scrubbed after expiration.`}
                  className={`w-full bg-transparent p-3 sm:p-4 text-xs sm:text-sm font-mono leading-[20px] text-[#FDFFF1] focus:outline-none resize-none overflow-y-auto ${
                    wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
                  }`}
                  spellCheck={false}
                />
              </div>
            ) : (
              /* Drag & Drop File Upload Area */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`min-h-[300px] flex flex-col items-center justify-center p-6 sm:p-8 cursor-pointer transition-all border-2 border-dashed m-3 sm:m-4 rounded-2xl ${
                  isDragging
                    ? 'border-[#B7F36B] bg-[#B7F36B]/5'
                    : 'border-[#2C303B] hover:border-[#B7F36B]/60 bg-[#13161F]/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      if (f.size > 10 * 1024 * 1024) {
                        onNotify('File exceeds 10 MB limit', 'error');
                        return;
                      }
                      setSelectedFile(f);
                      if (!title) setTitle(f.name);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="text-center space-y-3 max-w-sm">
                    <div className="w-16 h-16 rounded-2xl bg-[#B7F36B]/15 border border-[#B7F36B]/30 flex items-center justify-center mx-auto text-[#B7F36B]">
                      <span className="material-symbols-outlined text-[32px]">
                        {selectedFile.type.startsWith('image/')
                          ? 'image'
                          : selectedFile.type.includes('pdf')
                          ? 'picture_as_pdf'
                          : selectedFile.type.includes('zip')
                          ? 'folder_zip'
                          : 'description'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-mono font-semibold text-[#FDFFF1] break-all">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs font-mono text-[#A6ABB9] mt-1">
                        {selectedFile.size < 1024 * 1024
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                          : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}{' '}
                        • {selectedFile.type || 'Binary Document'}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#222631] text-xs font-mono text-[#FDFFF1] hover:bg-[#2C303B] transition-colors cursor-pointer"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-500/15 text-xs font-mono text-red-400 hover:bg-red-500/25 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 max-w-md">
                    <div className="w-14 h-14 rounded-2xl bg-[#222631] border border-[#2C303B] flex items-center justify-center mx-auto text-[#A6ABB9]">
                      <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-semibold text-[#FDFFF1]">
                        Tap to choose or drag & drop a file here
                      </div>
                      <div className="text-xs font-mono text-[#A6ABB9] mt-1">
                        Images (PNG, JPG, WEBP), Documents (PDF, TXT, MD), Configs (YAML, JSON, SQL), Archives up to 10 MB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#222631] hover:bg-[#2C303B] border border-[#2C303B] text-xs font-mono text-[#FDFFF1] font-semibold transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">folder_open</span>
                      <span>Browse Files</span>
                    </button>

                    <div className="text-[11px] font-mono text-[#A6ABB9]/70 pt-1">
                      Encrypted in transit • Auto-scrubbed on expiry
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Status & TTL Bar */}
            <div className="flex flex-wrap items-center justify-between border-t border-[#2C303B] bg-[#13161F] px-4 py-2.5 text-xs font-mono text-[#A6ABB9] gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                {mode === 'text' ? (
                  <>
                    <span>{linesCount} lines</span>
                    <span>•</span>
                    <span>{charsCount} chars</span>
                    <span>•</span>
                    <span>{bytesCount < 1024 ? `${bytesCount} B` : `${(bytesCount / 1024).toFixed(1)} KB`}</span>
                  </>
                ) : (
                  <span>Max file size: 10 MB</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#A6ABB9]/80">TTL:</span>
                {(['1h', '24h', '7d'] as TtlOption[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTtl(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      ttl === t
                        ? 'bg-[#B7F36B] text-[#10131A] font-bold shadow-sm'
                        : 'bg-[#222631] text-[#A6ABB9] hover:text-[#FDFFF1]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-[#A6ABB9] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#B7F36B]">lock</span>
              <span>Encrypted in transit • Zero retention</span>
            </div>

            <button
              onClick={handleBroadcast}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] font-mono text-sm font-bold tracking-tight transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(183,243,107,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#10131A] border-t-transparent rounded-full animate-spin"></span>
                  <span>Uploading & Broadcasting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px] font-bold">cell_tower</span>
                  <span>Broadcast Drop (Send)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Broadcast Deck */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {activeShare ? (
            /* ACTIVE BROADCAST CARD */
            <div className="bg-[#1A1D26] border border-[#B7F36B]/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-[0_0_25px_rgba(183,243,107,0.08)]">
              {/* Header with ShortCode */}
              <div className="flex items-center justify-between border-b border-[#2C303B] pb-4">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#A6ABB9]">
                    Live Broadcast Channel
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#B7F36B] flex items-center gap-2 mt-0.5">
                    <span>#{activeShare.shortCode}</span>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B7F36B] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B7F36B]"></span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenRecipient(activeShare)}
                    className="px-3 py-1.5 rounded-xl bg-[#B7F36B]/20 hover:bg-[#B7F36B]/30 border border-[#B7F36B]/40 text-xs font-mono text-[#B7F36B] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open recipient view directly"
                  >
                    <span>View</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                  <button
                    onClick={resetForNewDrop}
                    className="p-1.5 rounded-xl bg-[#222631] hover:bg-[#2C303B] text-[#A6ABB9] hover:text-[#FDFFF1] transition-colors cursor-pointer"
                    title="New Drop"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>

              {/* Option 1: QR Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#FDFFF1] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#B7F36B]">qr_code_2</span>
                    Option 1: Scan with Camera
                  </span>
                  <span className="text-[11px] text-[#B7F36B]">Instant Mobile</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#10131A] rounded-2xl border border-[#2C303B]">
                  {qrDataUrl ? (
                    <div className="p-3 bg-[#FDFFF1] rounded-xl shadow-md">
                      <img
                        src={qrDataUrl}
                        alt="Drop QR Code"
                        className="w-44 h-44 sm:w-48 sm:h-48 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-xs font-mono text-[#A6ABB9]">
                      Generating QR...
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-[#A6ABB9] mt-3 text-center">
                    Point any phone camera to decrypt and download directly.
                  </div>
                </div>
              </div>

              {/* Option 2: 6-Character Code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#FDFFF1] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#B7F36B]">pin</span>
                    Option 2: 6-Character Code
                  </span>
                  <span className="text-[11px] text-[#A6ABB9]">Receiver Enters Code</span>
                </div>
                <div className="bg-[#10131A] border border-[#B7F36B]/40 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-[#A6ABB9] uppercase block">Share Code</span>
                    <span className="text-xl sm:text-2xl font-mono font-bold text-[#B7F36B] tracking-widest">
                      {activeShare.shortCode}
                    </span>
                  </div>
                  <button
                    onClick={() => copyText(activeShare.shortCode, 'share code')}
                    className="px-3 py-1.5 bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Option 3: Direct Link */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#A6ABB9] flex justify-between">
                  <span className="font-semibold text-[#FDFFF1] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#B7F36B]">link</span>
                    Option 3: Direct Link
                  </span>
                  <button
                    onClick={() => copyText(activeShare.shareUrl, 'share link')}
                    className="text-[#B7F36B] hover:underline text-xs cursor-pointer"
                  >
                    Copy Link
                  </button>
                </div>
                <div className="flex items-center gap-2 bg-[#10131A] border border-[#2C303B] rounded-xl p-2 font-mono text-xs">
                  <span className="text-[#FDFFF1] truncate flex-1">{activeShare.shareUrl}</span>
                  <button
                    onClick={() => copyText(activeShare.shareUrl, 'share link')}
                    className="p-1 hover:bg-[#222631] rounded text-[#A6ABB9] hover:text-[#FDFFF1] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  </button>
                </div>
              </div>

              {/* TTL Telemetry */}
              <div className="p-3 bg-[#10131A] rounded-xl border border-[#2C303B] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-amber-400">timer</span>
                  <span className="text-[#A6ABB9]">Self-destruct timer:</span>
                </div>
                <span className="text-[#FDFFF1] font-bold">Expires in ~{ttl}</span>
              </div>
            </div>
          ) : (
            /* READY / STANDBY DECK */
            <div className="bg-[#1A1D26] border border-[#2C303B] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#2C303B] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B7F36B] animate-pulse"></span>
                  <span className="font-mono text-xs uppercase tracking-wider text-[#FDFFF1] font-bold">
                    Broadcast Deck (Standby)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#A6ABB9]">Ready</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222631] text-[#B7F36B] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#FDFFF1]">Add Your Content</div>
                    <div className="text-[11px] font-mono text-[#A6ABB9] mt-0.5">
                      Paste code/text or drop files up to 10 MB (PNG, JPG, PDF, ZIP, YAML, etc.).
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222631] text-[#B7F36B] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#FDFFF1]">Set Self-Destruct</div>
                    <div className="text-[11px] font-mono text-[#A6ABB9] mt-0.5">
                      Choose retention time (1 hour, 24 hours, or 7 days).
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#222631] text-[#B7F36B] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[#FDFFF1]">Broadcast & Share</div>
                    <div className="text-[11px] font-mono text-[#A6ABB9] mt-0.5">
                      Click Broadcast to instantly get a QR code, 6-character shortcode, and link.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#10131A] rounded-xl border border-[#2C303B] text-center space-y-2">
                <span className="material-symbols-outlined text-[28px] text-[#A6ABB9]/60">cell_tower</span>
                <div className="text-xs font-mono text-[#A6ABB9]">
                  Hit <strong className="text-[#B7F36B]">Broadcast Drop</strong> below to generate live transmission keys.
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Zero Retention Widget */}
          <div className="bg-[#10131A] border border-[#2C303B] rounded-2xl p-5 space-y-2.5 text-xs font-mono text-[#A6ABB9]">
            <div className="flex items-center gap-2 text-[#FDFFF1] font-semibold">
              <span className="material-symbols-outlined text-[#B7F36B] text-[18px]">security</span>
              <span>Zero-Retention Policy</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#A6ABB9]/80">
              Drops reside strictly in ephemeral storage. When the TTL timer hits zero or max downloads are met, the payload is irrevocably purged. No tracking cookies or telemetry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
