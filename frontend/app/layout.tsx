import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ServiceWorkerRegistration } from '@/components/providers/ServiceWorkerRegistration';

const inter = localFont({
  src: '../public/fonts/inter-latin-variable.woff2',
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Amigal — Secure Video Collaboration',
    template: '%s | Amigal',
  },
  description:
    'Crystal-clear video meetings, end-to-end encryption, and intelligent collaboration tools — all in one beautiful platform.',
  keywords: ['video conferencing', 'webrtc', 'collaboration', 'secure chat', 'screen sharing'],
  authors: [{ name: 'Amigal' }],
  creator: 'Amigal',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://app.amigal.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Amigal',
    title: 'Amigal — Secure Video Collaboration',
    description: 'Connect without boundaries. Secure, high-quality video meetings.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Amigal Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amigal — Secure Video Collaboration',
    description: 'Connect without boundaries. Secure, high-quality video meetings.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/safari-pinned-tab.svg',
        color: '#0ea5e9',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  colorScheme: 'dark light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head />
      <body
        className={`${inter.className} min-h-screen bg-background font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="amigal-theme"
        >
          <AuthProvider>
            <SocketProvider>
              <ToastProvider>
                {children}
                <ServiceWorkerRegistration />
              </ToastProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
