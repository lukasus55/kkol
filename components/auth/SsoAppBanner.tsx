'use client';

import React from 'react';

interface SsoAppBannerProps {
  appId?: string | null;
  redirectUri?: string | null;
}

export function SsoAppBanner({ appId, redirectUri }: SsoAppBannerProps) {
  if (!redirectUri && !appId) return null;

  let domain = '';
  if (redirectUri) {
    try {
      const parsed = new URL(redirectUri);
      domain = parsed.hostname;
    } catch {
      domain = redirectUri;
    }
  }

  const appDisplayName = appId || domain || 'aplikacji';

  return (
    <div className="text-center mb-6">
      <span className="text-xs text-text-500 block">Logujesz się do usługi:</span>
      <span className="text-base font-semibold text-text-900 block mt-0.5">{appDisplayName}</span>
      {domain && appId && domain !== appId && (
        <span className="text-xs text-text-500 block mt-0.5">{domain}</span>
      )}
    </div>
  );
}
