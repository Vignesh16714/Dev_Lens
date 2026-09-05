import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DevLens — Developer Intelligence Platform',
    template: '%s · DevLens',
  },
  description:
    'Transform public GitHub data into meaningful developer intelligence: activity, project quality, technology evolution, collaboration, growth, AI insights and career readiness.',
  applicationName: 'DevLens',
};

export const viewport: Viewport = {
  themeColor: '#010409',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canva text-[#e6edf3] antialiased">
        {children}
      </body>
    </html>
  );
}