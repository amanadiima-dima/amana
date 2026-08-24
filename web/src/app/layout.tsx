import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amana – Trusted Parcel Delivery by Travelers',
  description: 'Send your parcels with travelers going your way. Fast, affordable, and trusted.',
  openGraph: {
    title: 'Amana',
    description: 'Peer-to-peer parcel delivery by trusted travelers.',
    siteName: 'Amana',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
