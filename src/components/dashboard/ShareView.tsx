'use client';

import { useState } from 'react';
import { Share2, Check, Copy, ExternalLink } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';
import { useReport } from './useReport';
import { Section } from './Section';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShareCard } from './ShareCard';

export function ShareView() {
  const { data } = useAnalysis();
  const { report } = useReport();
  const [copied, setCopied] = useState(false);

  const username = report.user?.login ?? data?.requestedUsername ?? '';
  const shareUrl = `${window.location.origin}/share/${encodeURIComponent(username)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-5">
      <Section title="Shareable profile" subtitle="A public DevLens developer card you can share" icon={Share2} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex justify-center lg:justify-start">
          <ShareCard report={report} />
        </div>

        <Card>
          <CardBody>
            <h3 className="mb-1 text-sm font-semibold text-[#e6edf3]">Public share link</h3>
            <p className="mb-3 text-xs text-muted">
              Anyone with this link can view @{username}'s DevLens card. It reflects a snapshot of public GitHub data.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 truncate rounded-md border border-borderline bg-elevated px-3 py-2 font-mono text-xs text-[#c9d1d9]">
                {shareUrl}
              </div>
              <Button variant="primary" size="md" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
            <div className="mt-4">
              <a href={`/share/${encodeURIComponent(username)}`} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="md">
                  <ExternalLink className="h-4 w-4" /> Open public card
                </Button>
              </a>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge tone="muted">Snapshot</Badge>
              <p className="text-[11px] text-muted">Regenerate the analysis to refresh this snapshot.</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}