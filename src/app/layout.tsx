import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { API_BASE_URL } from '@/lib/config/api-config';
import { THEME_INIT_SCRIPT } from '@/lib/theme-storage';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MARFYL',
  description: 'Plataforma multi-tenant para facturación, inventario y operaciones',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MARFYL',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'MARFYL',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'MARFYL',
    'format-detection': 'telephone=no',
    'msapplication-TileColor': '#38BDF8',
    'msapplication-TileImage': '/android-chrome-192x192.png',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#38BDF8',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__NEXT_PUBLIC_API_URL__=${JSON.stringify(API_BASE_URL)};`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <PWAInstallPrompt />
            <Toaster richColors position="top-center" closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
