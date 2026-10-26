import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShareItem } from '../types';
import { deleteShare, getFileDownloadUrl, API_BASE } from '../services/api';

interface RecipientViewProps {
  share: ShareItem;
  onForkDrop: (content: string, title: string, language: string) => void;
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onDeleted?: () => void;
}

export const RecipientView: React.FC<RecipientViewProps> = ({ share, onForkDrop, onNotify, onDeleted }) => {
  const [wrapLines, setWrapLines] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(share.expiresAt).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  const isFile = share.type === 'file';
  const isImage = isFile && share.file?.mimeType?.startsWith('image/');
  const payloadText = share.textContent || '';

  const [payloadHash, setPayloadHash] = useState<string>('');

  // Real SHA-256 hash computation
  useEffect(() => {
    const textToHash = payloadText || share.file?.originalName || share.title;
    if (!textToHash) {
      setPayloadHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(textToHash);
    window.crypto.subtle.digest('SHA-256', data)
      .then((buf) => {
        const hashArray = Array.from(new Uint8Array(buf));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        setPayloadHash(hashHex);
      })
      .catch(() => {
        setPayloadHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
      });
  }, [payloadText, share.file, share.title]);

  // Live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date(share.expiresAt).getTime() - Date.now()) / 1000);
      setSecondsRemaining(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [share.expiresAt]);

  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return 'Expired';
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Generate QR for modal
  useEffect(() => {
    if (showQrModal) {
      QRCode.toDataURL(share.shareUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#10131A',
          light: '#FDFFF1',
        },
      })
        .then((url) => setQrModalUrl(url))
        .catch((e) => console.error(e));
    }
  }, [showQrModal, share.shareUrl]);

  const handleCopyRaw = () => {
    if (payloadText) {
      navigator.clipboard.writeText(payloadText);
      onNotify('Copied snippet to clipboard!', 'success');
    }
  };

  const handleDelete = async () => {
    if (!share.deleteToken) return;
    if (!window.confirm('Are you sure you want to immediately purge this drop from storage?')) return;

    setIsDeleting(true);
    try {
      const ok = await deleteShare(share.shareId, share.deleteToken);
      if (ok) {
        onNotify('Drop purged permanently from storage.', 'success');
        onDeleted?.();
      } else {
        onNotify('Could not delete drop or already expired.', 'error');
      }
    } catch {
      onNotify('Failed to delete drop.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = () => {
    if (isFile) {
      const downloadUrl = share.file?.downloadUrl || getFileDownloadUrl(share.shareId);
      window.open(downloadUrl, '_blank');
      onNotify(`Downloading ${share.file?.originalName || share.title}...`, 'info');
      return;
    }

    // Download text payload as file
    const blob = new Blob([payloadText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = share.title.includes('.') ? share.title : `${share.title || 'kwick'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${share.title}`, 'success');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(share.shareUrl);
    onNotify('Copied share link to clipboard!', 'success');
  };

  const lines = payloadText ? payloadText.split('\n') : [];
  const formattedFileSize = share.file
    ? share.file.sizeBytes < 1024 * 1024
      ? `${(share.file.sizeBytes / 1024).toFixed(1)} KB`
      : `${(share.file.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
    : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Top Decryption Stream Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#2C303B]/60">
        <div className="flex items-center gap-2 font-mono text-xs text-[#A6ABB9]">
          <span className="w-2 h-2 rounded-full bg-[#B7F36B] animate-ping"></span>
          <span className="text-[#FDFFF1] font-semibold">Decrypted Transmission</span>
          <span>•</span>
          <span className="text-[#B7F36B]">#{share.shortCode}</span>
        </div>

        <div className="flex items-center gap-2 bg-[#1A1D26] border border-[#2C303B] px-3 py-1 rounded-full text-xs font-mono">
          <span className="material-symbols-outlined text-amber-400 text-[16px]">hourglass_top</span>
          <span className="text-[#A6ABB9]">Self-destruct:</span>
          <span className="text-[#B7F36B] font-bold">{formatCountdown(secondsRemaining)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Main Content Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-[#1A1D26] border border-[#2C303B] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#B7F36B]/15 text-[#B7F36B] font-semibold border border-[#B7F36B]/30">
                    {isFile ? 'File Payload' : 'Text Payload'}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#FDFFF1]">
                    #{share.shortCode}
                  </span>
                  {isFile && share.file && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#2C303B] text-[#A6ABB9]">
                      {formattedFileSize}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#FDFFF1] truncate">
                  {share.title}
                </h1>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {isFile ? (
                  /* File actions */
                  <>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2.5 rounded-xl bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] font-mono font-bold text-xs transition-transform active:scale-95 flex items-center gap-2 shadow-[0_0_12px_rgba(183,243,107,0.25)] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Download File</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 rounded-xl bg-[#222631] hover:bg-[#2C303B] border border-[#2C303B] text-xs font-mono text-[#FDFFF1] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copy Direct Link"
                    >
                      <span className="material-symbols-outlined text-[16px]">link</span>
                      <span className="hidden sm:inline">Copy Link</span>
                    </button>
                  </>
                ) : (
                  /* Text actions */
                  <>
                    <button
                      onClick={handleCopyRaw}
                      className="px-3.5 py-2.5 rounded-xl bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] font-mono font-bold text-xs transition-transform active:scale-95 flex items-center gap-1.5 shadow-[0_0_12px_rgba(183,243,107,0.25)] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Copy Text</span>
                    </button>

                    <button
                      onClick={handleDownload}
                      className="px-3 py-2 rounded-xl bg-[#222631] hover:bg-[#2C303B] border border-[#2C303B] text-xs font-mono text-[#FDFFF1] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download as File"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    <button
                      onClick={() => onForkDrop(payloadText, share.title, share.language || 'plaintext')}
                      className="px-3 py-2 rounded-xl bg-[#222631] hover:bg-[#2C303B] border border-[#2C303B] text-xs font-mono text-[#A6ABB9] hover:text-[#FDFFF1] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Fork and edit this payload"
                    >
                      <span className="material-symbols-outlined text-[16px]">fork_right</span>
                      <span className="hidden sm:inline">Fork</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowQrModal(true)}
                  className="p-2 rounded-xl bg-[#222631] hover:bg-[#2C303B] border border-[#2C303B] text-[#FDFFF1] transition-colors cursor-pointer"
                  title="Show QR Code"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                </button>

                {share.deleteToken && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Purge drop immediately from storage"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>{isDeleting ? 'Purging...' : 'Purge'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DEDICATED FILE VIEW vs TEXT CODE VIEWER */}
          {isFile ? (
            <div className="bg-[#10131A] border border-[#2C303B] rounded-2xl overflow-hidden shadow-sm">
              {/* Image Preview if Image */}
              {isImage && (share.file?.publicUrl || share.file?.downloadUrl) ? (
                <div className="p-4 sm:p-6 flex flex-col items-center justify-center bg-[#13161F]/60 border-b border-[#2C303B]">
                  <img
                    src={share.file?.publicUrl || share.file?.downloadUrl}
                    alt={share.file?.originalName || 'Preview'}
                    className="max-h-[420px] max-w-full object-contain rounded-xl shadow-lg border border-[#2C303B]"
                    loading="lazy"
                  />
                  <div className="mt-3 text-xs font-mono text-[#A6ABB9]">
                    {share.file?.originalName} • {formattedFileSize}
                  </div>
                </div>
              ) : (
                /* Document / Archive Card */
                <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-[#B7F36B]/10 border border-[#B7F36B]/30 flex items-center justify-center text-[#B7F36B] shadow-[0_0_24px_rgba(183,243,107,0.15)]">
                    <span className="material-symbols-outlined text-[44px]">
                      {share.file?.mimeType?.includes('pdf')
                        ? 'picture_as_pdf'
                        : share.file?.mimeType?.includes('zip') || share.file?.mimeType?.includes('tar')
                        ? 'folder_zip'
                        : 'description'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-mono text-[#FDFFF1] break-all max-w-md">
                      {share.file?.originalName || share.title}
                    </h2>
                    <div className="text-xs font-mono text-[#A6ABB9] mt-1.5 flex items-center justify-center gap-2">
                      <span>{formattedFileSize}</span>
                      <span>•</span>
                      <span>{share.file?.mimeType || 'Binary file'}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="mt-2 px-6 py-3 rounded-xl bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] font-mono font-bold text-sm transition-transform active:scale-95 flex items-center gap-2 shadow-[0_0_16px_rgba(183,243,107,0.3)] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Download {share.file?.originalName || 'File'}</span>
                  </button>
                </div>
              )}

              {/* File Metadata Subbar */}
              <div className="px-4 py-3 bg-[#1A1D26]/70 border-t border-[#2C303B] flex flex-wrap items-center justify-between text-xs font-mono text-[#A6ABB9] gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#B7F36B]"></span>
                  <span>Encrypted in transit</span>
                </div>
                <div>
                  Expires in <strong className="text-[#FDFFF1]">{formatCountdown(secondsRemaining)}</strong>
                </div>
              </div>
            </div>
          ) : (
            /* Syntax Code Viewer for Text Drops */
            <div className="bg-[#10131A] border border-[#2C303B] rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#1A1D26]/80 border-b border-[#2C303B] text-xs font-mono text-[#A6ABB9]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2C303B]"></span>
                  <span>{lines.length} lines</span>
                  <span>•</span>
                  <span>{new Blob([payloadText]).size} bytes</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setWrapLines(!wrapLines)}
                    className={`hover:text-[#FDFFF1] flex items-center gap-1 cursor-pointer ${
                      wrapLines ? 'text-[#B7F36B]' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">wrap_text</span>
                    <span>Wrap: {wrapLines ? 'On' : 'Off'}</span>
                  </button>
                  <span className="text-[#2C303B]">|</span>
                  <span className="text-[11px] text-[#A6ABB9]/70 uppercase">Read-Only</span>
                </div>
              </div>

              {/* Code Body with Line Number Gutter */}
              <div className="flex min-h-[300px] max-h-[550px] overflow-auto">
                <div className="hidden sm:block select-none py-3 px-3 text-right font-mono text-[11px] leading-[22px] text-[#A6ABB9]/30 border-r border-[#2C303B] bg-[#10131A] w-12 flex-shrink-0">
                  {lines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <pre
                  className={`p-3 sm:p-4 font-mono text-xs sm:text-sm leading-[22px] text-[#FDFFF1] flex-1 m-0 ${
                    wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
                  }`}
                >
                  <code>{payloadText}</code>
                </pre>
              </div>

              {/* SHA-256 Hash Gutter */}
              <div className="border-t border-[#2C303B] p-3 bg-[#1A1D26]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-[#A6ABB9]">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[#B7F36B] font-semibold uppercase">SHA-256:</span>
                  <span className="truncate text-[#FDFFF1]/80">{payloadHash}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(payloadHash);
                    onNotify('Copied SHA-256 hash to clipboard', 'info');
                  }}
                  className="hover:text-[#FDFFF1] flex items-center gap-1 flex-shrink-0 text-[#B7F36B] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copy Hash</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Share Link & Terminal One-Liner */}
          <div className="p-4 bg-[#1A1D26] border border-[#2C303B] rounded-2xl space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-[#A6ABB9] flex items-center justify-between">
              <span>Terminal Ingestion</span>
              <button
                onClick={() => {
                  const curlHost = API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
                  const cmd = `curl -sL ${curlHost}/api/v1/s/${share.shortCode}`;
                  navigator.clipboard.writeText(cmd);
                  onNotify('Copied cURL command to clipboard!', 'info');
                }}
                className="text-[#B7F36B] hover:underline cursor-pointer"
              >
                Copy cURL
              </button>
            </div>
            <div className="flex items-center justify-between bg-[#10131A] rounded-xl p-2.5 font-mono text-xs text-[#FDFFF1] border border-[#2C303B]">
              <code className="text-[#B7F36B] truncate">
                $ curl -sL {API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')}/api/v1/s/{share.shortCode}
              </code>
              <button
                onClick={() => {
                  const curlHost = API_BASE || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
                  const cmd = `curl -sL ${curlHost}/api/v1/s/${share.shortCode}`;
                  navigator.clipboard.writeText(cmd);
                  onNotify('Copied cURL command to clipboard!', 'info');
                }}
                className="p-1 text-[#A6ABB9] hover:text-[#FDFFF1] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Information & Lifecycle Dock (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Ephemeral TTL Lifecycle Widget */}
          <div className="bg-[#1A1D26] border border-[#2C303B] rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A6ABB9]">
                TTL Lifecycle
              </span>
              <span className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Active
              </span>
            </div>

            {/* Countdown Clock */}
            <div className="p-4 bg-[#10131A] rounded-xl border border-[#2C303B] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#A6ABB9] block">Time Remaining</span>
              <div className="text-2xl font-mono font-bold text-[#B7F36B] tracking-wider">
                {formatCountdown(secondsRemaining)}
              </div>
            </div>

            <div className="p-3 bg-[#10131A] rounded-xl border border-[#2C303B] text-xs font-mono space-y-1.5 text-[#A6ABB9]">
              <div className="flex justify-between">
                <span>Expires At:</span>
                <span className="text-[#FDFFF1]">{new Date(share.expiresAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Expires Date:</span>
                <span className="text-[#FDFFF1]">{new Date(share.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Quick QR Sharing Card */}
          <div className="bg-[#1A1D26] border border-[#2C303B] rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wider text-[#A6ABB9] font-semibold">
                Share With Others
              </span>
              <span className="text-[#B7F36B] font-bold">#{share.shortCode}</span>
            </div>

            <div className="p-3 bg-[#10131A] rounded-xl border border-[#2C303B] flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#FDFFF1] truncate">{share.shareUrl}</span>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded bg-[#B7F36B] hover:bg-[#a6e656] text-[#10131A] font-semibold text-xs transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>

            <div className="text-[11px] text-[#A6ABB9] leading-relaxed">
              Anyone with this link or shortcode <strong>#{share.shortCode}</strong> can view and download this drop until expiration.
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="bg-[#10131A] border border-[#2C303B] rounded-2xl p-4 space-y-2 text-xs font-mono text-[#A6ABB9]">
            <div className="flex items-center gap-2 text-[#FDFFF1] font-semibold">
              <span className="material-symbols-outlined text-[#B7F36B] text-[18px]">verified_user</span>
              <span>Zero Retention Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#A6ABB9]/80">
              When the self-destruct timer expires, all binary buffers and metadata are permanently scrubbed from Cloudinary and database records.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Lightbox Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#1A1D26] border border-[#2C303B] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono font-bold text-[#FDFFF1]">Scan to Open Drop</div>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-lg bg-[#222631] text-[#A6ABB9] hover:text-[#FDFFF1] flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-[#FDFFF1] rounded-2xl inline-block shadow-lg mx-auto">
              {qrModalUrl && (
                <img src={qrModalUrl} alt="Drop QR Code" className="w-56 h-56 rounded-lg" />
              )}
            </div>

            <div className="font-mono text-xs text-[#A6ABB9]">
              Shortcode: <strong className="text-[#B7F36B] text-base">#{share.shortCode}</strong>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#222631] hover:bg-[#2C303B] text-[#FDFFF1] font-mono text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
