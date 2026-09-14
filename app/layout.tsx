import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Electromagnetic Poynting Field Architecture',
  description: 'Interactive electromagnetic field topology, Poynting vector power flow simulation, CCV-01 Corridor Coupling Vehicle architecture, and multi-geometry coupling experiment across G_n polygon ecosystems.',
  openGraph: {
    title: 'Electromagnetic Poynting Field Architecture',
    description: 'Interactive electromagnetic field topology, Poynting vector power flow simulation, CCV-01 Corridor Coupling Vehicle architecture, and multi-geometry coupling experiment across G_n polygon ecosystems.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Electromagnetic Poynting Field Architecture',
    description: 'Interactive electromagnetic field topology, Poynting vector power flow simulation, CCV-01 Corridor Coupling Vehicle architecture, and multi-geometry coupling experiment across G_n polygon ecosystems.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
