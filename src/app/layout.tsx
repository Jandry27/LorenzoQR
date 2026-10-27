import type { Metadata, Viewport } from 'next';
import { Cinzel, Cormorant_Garamond, Lato } from 'next/font/google';
import './globals.css';
import { MARCA } from '../lib/marca';
import Script from 'next/script';

const inscription = Cinzel({ variable: '--font-inscription', subsets: ['latin'], weight: ['400', '500'], display: 'swap' });
const editorial = Cormorant_Garamond({ variable: '--font-serif', subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], display: 'swap' });
const body = Lato({ variable: '--font-sans', subsets: ['latin'], weight: ['400', '700'], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, themeColor: '#f8f9fa',
};

export const metadata: Metadata = {
  applicationName: MARCA.nombre,
  title: { default: `Lorenzo Chamba · ${MARCA.nombre}`, template: `%s · ${MARCA.nombre}` },
  description: 'En memoria de Lorenzo Chamba. 28 de abril de 1933 — 20 de octubre de 2026. Fotografías conservadas por su familia.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${body.variable} ${editorial.variable} ${inscription.variable}`}>
      <body>
        <Script id="memorial-inicio" strategy="beforeInteractive">{`
          (() => {
            const memorial = location.pathname === '/' || location.pathname.startsWith('/m/');
            const navegacion = performance.getEntriesByType('navigation')[0];
            const portada = !location.hash || location.hash === '#contenido';
            if (memorial && portada && navegacion?.type !== 'back_forward') {
              history.scrollRestoration = 'manual';
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            }
          })();
        `}</Script>
        <a className="skip-link" href="#contenido">Ir al contenido</a>
        <main className="app-container" id="contenido">{children}</main>
      </body>
    </html>
  );
}
