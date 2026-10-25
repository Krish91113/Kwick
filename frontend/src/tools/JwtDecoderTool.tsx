import React, { useState, useEffect } from 'react';

interface JwtDecoderToolProps {
  onToast: (msg: string) => void;
  onShare: (content: string, title: string) => void;
}

export const JwtDecoderTool: React.FC<JwtDecoderToolProps> = ({ onToast, onShare }) => {
  // Sample JWT token for demonstration
  const [token, setToken] = useState<string>(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2Iiwicm9sZSI6ImVuZ2luZWVyIiwiaWF0IjoxNzM1Njk5MjAwLCJleHAiOjE3NjcyMzUyMDB9.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  );

  const [header, setHeader] = useState<string>('');
  const [payload, setPayload] = useState<string>('');
  const [signature, setSignature] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expiryStatus, setExpiryStatus] = useState<string>('');

  const decodeJwt = (jwtString: string) => {
    setError(null);
    setHeader('');
    setPayload('');
    setSignature('');
    setExpiryStatus('');

    const clean = jwtString.trim();
    if (!clean) return;

    const parts = clean.split('.');
    if (parts.length !== 3) {
      setError('Invalid JWT structure. A JWT must consist of three dot-separated Base64URL segments.');
      return;
    }

    try {
      const base64Decode = (str: string) => {
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        while (output.length % 4) {
          output += '=';
        }
        return decodeURIComponent(escape(atob(output)));
      };

      const decodedHeader = JSON.parse(base64Decode(parts[0]!));
      const decodedPayload = JSON.parse(base64Decode(parts[1]!));

      setHeader(JSON.stringify(decodedHeader, null, 2));
      setPayload(JSON.stringify(decodedPayload, null, 2));
      setSignature(parts[2] || '');

      // Check for 'exp' in payload
      if (decodedPayload.exp) {
        const expDate = new Date(decodedPayload.exp * 1000);
        const isExpired = Date.now() > expDate.getTime();
        setExpiryStatus(
          isExpired
            ? `Token Expired on ${expDate.toUTCString()}`
            : `Valid until ${expDate.toUTCString()}`
        );
      }
    } catch (e) {
      setError(`Failed to decode JWT: ${e instanceof Error ? e.message : 'Invalid payload'}`);
    }
  };

  useEffect(() => {
    decodeJwt(token);
  }, [token]);

  return (
    <div className="flex flex-col gap-space-md">
      {/* Header */}
      <div className="bg-surface-container-low p-space-md rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-container-high/40">
        <div className="flex items-center gap-space-md">
          <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shadow-sm border border-surface-container-high">
            <span className="material-symbols-outlined text-[24px]">vpn_key</span>
          </div>
          <div>
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                JWT Token Decoder
              </h2>
              <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-primary-container font-code-sm text-code-sm">
                Client Only
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Inspect JSON Web Token headers and claims in-browser without sending to any server
            </p>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => {
              setToken('');
              onToast('Input cleared');
            }}
            className="px-space-sm py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm border border-surface-container-high cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => onShare(payload, 'jwt-claims.json')}
            className="px-space-md py-1 rounded bg-primary-container text-on-primary-container font-code-sm text-code-sm font-semibold flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>Share Claims</span>
          </button>
        </div>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container border border-surface-container-high">
        <span className="material-symbols-outlined text-primary-container text-[20px]">
          verified_user
        </span>
        <p className="font-body-md text-code-sm text-on-surface-variant">
          <strong className="text-on-surface">Client-only decode:</strong> Does not transmit token over the wire and does not verify cryptographical signatures. Never paste private production secrets into untrusted tools.
        </p>
      </div>

      {/* Input */}
      <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
        <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40">
          <span className="text-on-surface-variant">Encoded JWT Token (Header.Payload.Signature)</span>
          {expiryStatus && (
            <span className="text-primary-container font-mono">{expiryStatus}</span>
          )}
        </div>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full h-28 p-space-md bg-surface-container-lowest text-on-surface font-mono text-code-sm resize-none focus:outline-none break-all"
          placeholder="Paste JWT string here..."
        />
      </div>

      {error ? (
        <div className="p-space-md rounded-lg bg-error-container text-on-error-container font-code-sm text-code-sm">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
          {/* Header */}
          <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
            <div className="px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40 text-on-surface-variant flex justify-between">
              <span>Decoded Header (Algorithm &amp; Type)</span>
              <span className="text-primary-container font-mono">HEADER</span>
            </div>
            <pre className="p-space-md font-mono text-code-sm text-primary-container overflow-auto max-h-80 select-all">
              {header || '// Header'}
            </pre>
          </div>

          {/* Payload */}
          <div className="flex flex-col bg-surface-container-lowest rounded-lg overflow-hidden border border-surface-container-high/40">
            <div className="px-space-md py-space-xs bg-surface-container-low font-code-sm text-code-sm border-b border-surface-container-high/40 text-on-surface-variant flex justify-between">
              <span>Decoded Payload (Claims &amp; Data)</span>
              <span className="text-secondary font-mono">PAYLOAD</span>
            </div>
            <pre className="p-space-md font-mono text-code-sm text-secondary overflow-auto max-h-80 select-all">
              {payload || '// Payload'}
            </pre>
          </div>
        </div>
      )}

      {/* Signature */}
      {signature && (
        <div className="p-space-sm rounded-lg bg-surface-container font-mono text-code-sm text-on-surface-variant flex items-center justify-between border border-surface-container-high">
          <span className="text-on-surface-variant/70">Signature: {signature.substring(0, 32)}...</span>
          <span className="text-secondary-fixed text-[11px]">HMAC / RSA verify omitted for privacy</span>
        </div>
      )}
    </div>
  );
};
