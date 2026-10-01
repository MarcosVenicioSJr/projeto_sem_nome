import localFont from 'next/font/local';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { getShopProfile } from '../_site/content';
import { DemoBanner } from '../_site/components/DemoBanner';
import { gateway } from '../_site/gateway';
import styles from '../_site/theme.module.css';

/**
 * Big Shoulders nasceu da sinalização urbana de Chicago: condensada, pesada,
 * feita para ser lida de longe — o mesmo papel do letreiro de barbearia. O
 * eixo `opsz` deixa os títulos gigantes mais fechados e os pequenos mais
 * legíveis. Archivo entra no texto corrido e nos números (preço, hora) por
 * ter algarismos tabulares e eixo de largura para rótulos compactos.
 *
 * Arquivos auto-hospedados (subset latino, variáveis, licença OFL em
 * _site/fonts): o site da barbearia não depende do Google Fonts no build
 * nem no carregamento.
 */
const display = localFont({
  src: '../_site/fonts/big-shoulders.woff2',
  weight: '100 900',
  variable: '--site-font-display',
  display: 'swap',
  fallback: ['Arial Narrow', 'sans-serif'],
});

const text = localFont({
  src: '../_site/fonts/archivo.woff2',
  weight: '100 900',
  variable: '--site-font-text',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getShopProfile(slug);
  const name = profile.name || 'Barbearia';
  return {
    title: `${name} · Agende seu horário`,
    description: `${profile.tagline.join(' ')} ${profile.intro}`.slice(0, 160),
  };
}

export const viewport: Viewport = {
  themeColor: '#0a0907',
  colorScheme: 'dark',
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${styles.theme} ${gateway.demo ? styles.demo : ''} ${display.variable} ${text.variable}`}
    >
      <DemoBanner />
      {children}
    </div>
  );
}
