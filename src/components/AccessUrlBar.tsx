import React, { useState, useCallback } from 'react';

interface AccessUrlBarProps {
  url: string;
  hasPublicAccess: boolean;
  size?: 'sm' | 'md';
}

export const AccessUrlBar: React.FC<AccessUrlBarProps> = ({ url, hasPublicAccess, size = 'sm' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [url]);

  if (!hasPublicAccess) return null;

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className={`${textSize} font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]`} title={url}>
        {url}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy access URL"
        className={`p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300`}
      >
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
      {copied && (
        <span className="absolute -bottom-4 left-0 text-[10px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  );
};
