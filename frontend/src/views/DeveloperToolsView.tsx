import React, { useState, useMemo } from 'react';
import { JsonFormatter } from '../tools/JsonFormatter';
import { Base64Tool } from '../tools/Base64Tool';
import { UuidTool } from '../tools/UuidTool';
import { UrlEncoderTool } from '../tools/UrlEncoderTool';
import { JwtDecoderTool } from '../tools/JwtDecoderTool';
import { TextDiffTool } from '../tools/TextDiffTool';
import { PasswordGeneratorTool } from '../tools/PasswordGeneratorTool';
import { TimestampTool } from '../tools/TimestampTool';
import { ColorConverterTool } from '../tools/ColorConverterTool';

interface DeveloperToolsViewProps {
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
  onShareSnippet?: (content: string, title: string) => void;
  initialToolId?: string;
}

interface ToolDefinition {
  id: string;
  name: string;
  category: 'Formatters' | 'Encoders & Decoders' | 'Generators' | 'Text & Code' | 'Security';
  icon: string;
  description: string;
}

const TOOLS: ToolDefinition[] = [
  {
    id: 'json',
    name: 'JSON Formatter & Validator',
    category: 'Formatters',
    icon: 'data_object',
    description: 'Format, validate, minify, sort keys, and inspect JSON in-browser.',
  },
  {
    id: 'base64',
    name: 'Base64 Encoder / Decoder',
    category: 'Encoders & Decoders',
    icon: 'transform',
    description: 'Bidirectional UTF-8 and URL-safe Base64 encoding.',
  },
  {
    id: 'jwt',
    name: 'JWT Decoder',
    category: 'Encoders & Decoders',
    icon: 'key',
    description: 'Zero-transmission JWT parser for header, payload, and claims.',
  },
  {
    id: 'url',
    name: 'URL Percent Encoder',
    category: 'Encoders & Decoders',
    icon: 'link',
    description: 'Encode and decode query strings and URI components.',
  },
  {
    id: 'uuid',
    name: 'UUID v4 Generator',
    category: 'Generators',
    icon: 'fingerprint',
    description: 'Cryptographically strong RFC 4122 v4 UUID batch generator.',
  },
  {
    id: 'password',
    name: 'Password & Entropy Generator',
    category: 'Generators',
    icon: 'security',
    description: 'WebCrypto CSPRNG password engine with entropy analysis.',
  },
  {
    id: 'diff',
    name: 'Text & Code Diff Checker',
    category: 'Text & Code',
    icon: 'difference',
    description: 'Line-by-line comparison highlighting additions and deletions.',
  },
  {
    id: 'timestamp',
    name: 'Timestamp & Epoch Converter',
    category: 'Formatters',
    icon: 'schedule',
    description: 'Live epoch ticker and bidirectional human-date translator.',
  },
  {
    id: 'color',
    name: 'Color Converter & Contrast',
    category: 'Formatters',
    icon: 'palette',
    description: 'HEX, RGB, HSL converter with WCAG contrast ratio calculations.',
  },
];

export const DeveloperToolsView: React.FC<DeveloperToolsViewProps> = ({ onNotify, onShareSnippet, initialToolId }) => {
  const [selectedToolId, setSelectedToolId] = useState<string>(initialToolId || 'json');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Formatters', 'Encoders & Decoders', 'Generators', 'Text & Code'];

  // Filter tools based on search and category
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || tool.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const activeTool = TOOLS.find((t) => t.id === selectedToolId) || TOOLS[0];

  const handleToast = (msg: string) => {
    onNotify(msg, 'info');
  };

  const handleShare = (content: string, title: string) => {
    if (onShareSnippet) {
      onShareSnippet(content, title);
    } else {
      navigator.clipboard.writeText(content);
      onNotify(`Copied ${title} to clipboard! Ready to share.`, 'success');
    }
  };

  const handleCopyCallback = (text: string) => {
    onNotify(`Copied ${text.length} characters to clipboard!`, 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-primary-container/15 text-primary-container border border-primary-container/30">
            Zero Telemetry
          </span>
          <span className="text-on-surface-variant text-xs font-mono">• 100% Client-Side In-Memory Execution</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
          Developer Utilities Hub
        </h1>
        <p className="text-secondary text-sm sm:text-base mt-1.5 max-w-2xl">
          High-performance browser utilities. No network hops, no logging. Your payloads never leave your browser window.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 sm:p-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            placeholder="Search utilities (Press / to focus)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg pl-9 pr-10 py-2 text-xs sm:text-sm font-mono text-primary placeholder-on-surface-variant/40 focus:outline-none focus:border-primary-container"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Tool Selector (Horizontal scroll chips on small screens) */}
      <div className="lg:hidden mb-6 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 min-w-max">
          {filteredTools.map((tool) => {
            const isSelected = tool.id === selectedToolId;
            return (
              <button
                key={tool.id}
                onClick={() => setSelectedToolId(tool.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary-container text-on-primary-container font-bold border-primary-container shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-primary border-outline-variant/20'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tool.icon}</span>
                <span>{tool.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Tools Directory Sidebar + Active Tool Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Directory Sidebar (Visible on Desktop lg+) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2 px-1">
            Available Tools ({filteredTools.length})
          </div>

          <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredTools.map((tool) => {
              const isSelected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container border-primary-container text-primary shadow-sm'
                      : 'bg-surface-container-low/60 border-outline-variant/15 text-on-surface-variant hover:text-primary hover:bg-surface-container hover:border-outline-variant/30'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tool.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-semibold truncate text-primary">
                        {tool.name}
                      </div>
                    </div>
                    <p className="text-[11px] text-secondary truncate mt-0.5">
                      {tool.description}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredTools.length === 0 && (
              <div className="p-6 text-center bg-surface-container-low border border-outline-variant/15 rounded-xl font-mono text-xs text-on-surface-variant">
                No developer tools match your search criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Active Tool Workspace (8 cols) */}
        <div className="lg:col-span-8 xl:col-span-9 bg-surface-container-low border border-surface-container-high/60 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
          {/* Tool Title Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-high/40 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container/15 border border-primary-container/30 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[24px]">{activeTool.icon}</span>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-mono text-primary">
                  {activeTool.name}
                </h2>
                <p className="text-xs font-mono text-secondary">{activeTool.description}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-[11px] font-mono text-on-surface-variant border border-surface-container-high">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
              <span>Client-Side Local</span>
            </div>
          </div>

          {/* Active Tool Dynamic View */}
          <div>
            {activeTool.id === 'json' && <JsonFormatter onShareJson={handleShare} onToast={handleToast} />}
            {activeTool.id === 'base64' && <Base64Tool onShare={handleShare} onToast={handleToast} />}
            {activeTool.id === 'jwt' && <JwtDecoderTool onShare={handleShare} onToast={handleToast} />}
            {activeTool.id === 'url' && <UrlEncoderTool onShare={handleShare} onToast={handleToast} />}
            {activeTool.id === 'uuid' && <UuidTool onShare={handleShare} onToast={handleToast} />}
            {activeTool.id === 'password' && <PasswordGeneratorTool onShare={handleShare} onToast={handleToast} />}
            {activeTool.id === 'diff' && <TextDiffTool onShare={handleShare} onToast={handleToast} />}
            {activeTool.id === 'timestamp' && <TimestampTool onCopy={handleCopyCallback} />}
            {activeTool.id === 'color' && <ColorConverterTool onCopy={handleCopyCallback} />}
          </div>
        </div>
      </div>
    </div>
  );
};
