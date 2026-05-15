import type {Metadata, Viewport} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PitchPulse | Pro Cricket Outcome Simulator',
  description: 'Experience a professional-grade cricket match simulator with real-time analytics, Hawkeye trajectory visualization, and tactical batting strategies.',
  keywords: ['cricket simulator', 'virtual cricket', 'match engine', 'sports analytics', 'batting strategy', 'cricket outcome generator'],
  authors: [{ name: 'PitchPulse Pro' }],
  openGraph: {
    title: 'PitchPulse | The Ultimate Cricket Simulator',
    description: 'Master the pitch with our advanced ball-by-ball simulation engine.',
    url: 'https://pitchpulse-pro.web.app',
    siteName: 'PitchPulse',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PitchPulse | Pro Cricket Simulator',
    description: 'Dynamic ball-by-ball virtual cricket for enthusiasts.',
  },
};

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
