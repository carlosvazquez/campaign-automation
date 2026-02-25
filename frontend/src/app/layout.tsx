'use client';

/** @file Root layout — wraps the entire app with global providers and base HTML structure */

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import './globals.css';

type LayoutProps = {
  children: React.ReactNode;
};

/**
 * Root application layout.
 * Provides the React Query client to the entire component tree and
 * renders devtools in development only.
 */
export default function RootLayout({ children }: LayoutProps): React.ReactElement {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </QueryClientProvider>
      </body>
    </html>
  );
}
