import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, ShareItem } from './types';
import { getShareByShortCode } from './services/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toast, ToastState } from './components/Toast';
import { ShareView } from './views/ShareView';
import { EnterCodeView } from './views/EnterCodeView';
import { RecipientView } from './views/RecipientView';
import { DeveloperToolsView } from './views/DeveloperToolsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('share');
  const [activeRecipientShare, setActiveRecipientShare] = useState<ShareItem>({
    shareId: 'default-drop-k992a',
    shortCode: 'K992A',
    type: 'text',
    title: 'k8s-ingress-prod.yaml',
    textContent: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-edge-router
  namespace: kwickdrop-core
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: 10m
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.kwickdrop.internal
    secretName: kwickdrop-tls-production
  rules:
  - host: api.kwickdrop.internal
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-service
            port:
              number: 443`,
    language: 'yaml',
    shareUrl: window.location.origin + '/#d=K992A',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + (23 * 3600 + 48 * 60) * 1000).toISOString(),
  });

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState<boolean>(false);

  const notify = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({
      show: true,
      message,
      type: type === 'error' ? 'error' : 'success',
    });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // Hash route parsing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#d=')) {
        const code = hash.replace('#d=', '').toUpperCase();
        if (code) {
          handleOpenRecipientByCode(code);
        }
      } else if (hash === '#tools') {
        setActiveTab('tools');
      } else if (hash === '#enter-code') {
        setActiveTab('enter-code');
      } else if (hash === '#share') {
        setActiveTab('share');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs or textareas
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowShortcutsModal(false);
        setShowHowItWorksModal(false);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setActiveTab('tools');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenRecipient = (share: ShareItem) => {
    setActiveRecipientShare(share);
    setActiveTab('recipient-view');
    window.location.hash = `#d=${share.shortCode}`;
  };

  const handleOpenRecipientByCode = async (code: string) => {
    const clean = code.trim().toUpperCase();
    try {
      const share = await getShareByShortCode(clean);
      setActiveRecipientShare(share);
      setActiveTab('recipient-view');
      window.location.hash = `#d=${clean}`;
      notify(`Loaded drop #${clean}: ${share.title}`, 'success');
    } catch (err: any) {
      notify(err.message || `Drop #${clean} could not be found or has expired.`, 'error');
    }
  };

  const handleForkDrop = (_content: string, _title: string, _language: string) => {
    setActiveTab('share');
    window.location.hash = '#share';
    notify('Loaded snippet into editor. You can now edit and re-broadcast.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'recipient-view') {
            window.location.hash = `#${tab}`;
          }
        }}
        onOpenHowItWorks={() => setShowHowItWorksModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 pb-20 sm:pb-12">
        {activeTab === 'share' && (
          <ShareView onNotify={notify} onOpenRecipient={handleOpenRecipient} />
        )}

        {activeTab === 'tools' && (
          <DeveloperToolsView
            onNotify={notify}
            onShareSnippet={(content, title) => {
              handleForkDrop(content, title, 'json');
            }}
          />
        )}

        {activeTab === 'enter-code' && (
          <EnterCodeView
            onOpenRecipientByCode={handleOpenRecipientByCode}
            onNotify={notify}
          />
        )}

        {activeTab === 'recipient-view' && (
          <RecipientView
            share={activeRecipientShare}
            onForkDrop={handleForkDrop}
            onNotify={notify}
          />
        )}

        {activeTab === 'how-it-works' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center mb-10">
              <span className="px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-xs font-mono text-primary-container mb-3 inline-block">
                Philosophy & Architecture
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
                How Kwick Works
              </h1>
              <p className="text-secondary text-sm sm:text-base mt-2 max-w-xl mx-auto">
                Designed for speed, zero friction, and uncompromising developer privacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">timer</span>
                </div>
                <h3 className="text-base font-semibold text-primary font-mono">1. Temporary by Default</h3>
                <p className="text-xs text-secondary leading-relaxed font-mono">
                  All drops have strict Time-To-Live limits (1 hour, 24 hours, or 7 days). Once expired, payloads are permanently wiped.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">no_accounts</span>
                </div>
                <h3 className="text-base font-semibold text-primary font-mono">2. Zero Mandatory Login</h3>
                <p className="text-xs text-secondary leading-relaxed font-mono">
                  No accounts, passwords, or tracking cookies. Open Kwick, execute your action or broadcast payload, and share.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">terminal</span>
                </div>
                <h3 className="text-base font-semibold text-primary font-mono">3. Terminal First</h3>
                <p className="text-xs text-secondary leading-relaxed font-mono">
                  Full CLI compatibility. Fetch any shared payload directly with curl or cat into your terminal pipes without a browser.
                </p>
              </div>

              <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">memory</span>
                </div>
                <h3 className="text-base font-semibold text-primary font-mono">4. Browser-Local Utilities</h3>
                <p className="text-xs text-secondary leading-relaxed font-mono">
                  All developer utilities (JSON, JWT, UUID, Base64, Diff, Passwords) compute 100% inside your browser Web Worker / JS runtime.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => setActiveTab('share')}
                className="px-6 py-3 rounded-lg bg-primary-container hover:bg-primary-fixed-dim text-on-primary-container font-headline-sm font-semibold transition-all shadow-sm cursor-pointer"
              >
                Start Dropping Content
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px]">keyboard</span>
                <h3 className="text-base font-bold font-mono text-primary">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {[
                { key: '⌘ + Enter', desc: 'Broadcast drop in editor' },
                { key: '⌘ + C', desc: 'Copy raw payload' },
                { key: '/', desc: 'Quick switch to Developer Utilities' },
                { key: '?', desc: 'Toggle keyboard shortcuts menu' },
                { key: 'Esc', desc: 'Dismiss active modal' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-2 rounded bg-surface-container-lowest border border-outline-variant/10"
                >
                  <span className="text-on-surface-variant">{s.desc}</span>
                  <kbd className="px-2 py-1 rounded bg-surface-container-high text-primary border border-surface-container-highest text-[11px] font-bold">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-primary transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* How It Works Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-container-high/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[20px]">info</span>
                <h3 className="text-base font-bold font-mono text-primary">How Kwick Works</h3>
              </div>
              <button
                onClick={() => setShowHowItWorksModal(false)}
                className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <div className="text-primary font-semibold mb-1">⚡ Ephemeral Transmissions</div>
                <div className="text-on-surface-variant">All drops automatically self-destruct after 1 hour, 24 hours, or 7 days. Once expired, files and text are permanently scrubbed.</div>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <div className="text-primary font-semibold mb-1">🔒 Zero Telemetry & Privacy</div>
                <div className="text-on-surface-variant">No account, login, or tracking. Developer tools (JSON, Base64, UUID, JWT, Diff) run 100% locally in your browser memory.</div>
              </div>
              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                <div className="text-primary font-semibold mb-1">💻 CLI Ingestion</div>
                <div className="text-on-surface-variant">Pipe directly to stdout: <code className="text-primary-container">curl -sL https://kwickdrop.app/d/K992A | jq .</code></div>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-primary transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Global Toast */}
      <Toast toast={toast} />
    </div>
  );
};

export default App;
