import type { StaticImageData } from 'next/image';
import afroFrente from './assets/afro-frente.webp';
import afroLateral from './assets/afro-lateral.webp';
import afroPerfil from './assets/afro-perfil.webp';
import afroTresQuartos from './assets/afro-tres-quartos.webp';
import onduladoDegrade from './assets/ondulado-degrade.webp';

/**
 * Conteúdo editorial do site público de cada barbearia.
 *
 * A API hoje só expõe `name` e `slug` do tenant (GET /t/:slug) e o catálogo
 * de serviços por profissional. Tudo o que é "vitrine" — frase de efeito,
 * fotos de trabalhos, contatos — ainda não tem onde morar no banco, então
 * fica aqui, indexado pelo slug. Quando o módulo "Meu site" do admin
 * persistir esses dados, este arquivo vira o fallback.
 *
 * Campos opcionais ausentes simplesmente não aparecem na página — nunca
 * preencha com dado inventado.
 */

export type WorkAngle = { src: StaticImageData; label: string; alt: string };

export type ShopWork =
  | { kind: 'angles'; title: string; description: string; angles: WorkAngle[] }
  | {
      kind: 'detail';
      title: string;
      description: string;
      src: StaticImageData;
      alt: string;
    };

export type ShopProfile = {
  slug: string;
  /** Nome como aparece na fachada/logo. A API pode sobrescrever. */
  name: string;
  /** Linha curta que abre o site, em duas partes: antes e depois do corte. */
  tagline: [string, string];
  intro: string;
  /** Fuso da barbearia. A API trabalha em UTC−3 (ver tenant-time.ts). */
  timeZone: string;
  works: ShopWork[];
  contact: {
    /** Só dígitos, com DDI (ex.: 5585999999999). */
    whatsapp?: string;
    /** Sem @. */
    instagram?: string;
    address?: string;
    mapsUrl?: string;
    /** Texto livre, ex.: "Ter a Sáb · 9h às 20h". */
    hours?: string;
  };
};

const romario: ShopProfile = {
  slug: 'romario-designer',
  name: 'Romario Designer Barbearia',
  tagline: ['Degradê na régua,', 'acabamento na navalha.'],
  intro:
    'Cada corte é desenhado para o seu cabelo — do cacheado ao liso, do pezinho ao topo. Escolha o serviço, o horário e pronto: a cadeira fica reservada para você.',
  timeZone: 'America/Fortaleza',
  works: [
    {
      kind: 'angles',
      title: 'Cacheado com degradê baixo',
      description:
        'Volume preservado no topo, transição limpa na lateral e contorno marcado na navalha.',
      angles: [
        {
          src: afroPerfil,
          label: 'Perfil',
          alt: 'Perfil do corte: cabelo cacheado volumoso no topo com degradê baixo na lateral',
        },
        {
          src: afroTresQuartos,
          label: 'Três-quartos',
          alt: 'Corte cacheado visto de três-quartos, mostrando a transição do degradê perto da orelha',
        },
        {
          src: afroFrente,
          label: 'Frente',
          alt: 'Corte cacheado visto de frente, com cachos definidos e contorno da testa alinhado',
        },
        {
          src: afroLateral,
          label: 'Outro lado',
          alt: 'Lado oposto do corte cacheado, com degradê baixo e costeleta desenhada',
        },
      ],
    },
    {
      kind: 'detail',
      title: 'Ondulado com degradê e franja',
      description:
        'Textura solta em cima e um degradê que some atrás da orelha. Passe o dedo ou o mouse para ver de perto.',
      src: onduladoDegrade,
      alt: 'Perfil de um corte ondulado com franja texturizada e degradê atrás da orelha',
    },
  ],
  // Dados de contato ainda não informados pela barbearia — preencher aqui.
  contact: {},
};

const PROFILES: Record<string, ShopProfile> = {
  [romario.slug]: romario,
};

/** Perfil genérico para barbearias que ainda não personalizaram o site. */
function genericProfile(slug: string): ShopProfile {
  return {
    slug,
    name: '',
    tagline: ['Seu horário,', 'sem fila e sem ligação.'],
    intro:
      'Escolha o serviço, o profissional e o horário que cabe no seu dia. Leva menos de um minuto.',
    timeZone: 'America/Fortaleza',
    works: [],
    contact: {},
  };
}

export function getShopProfile(slug: string): ShopProfile {
  return PROFILES[slug] ?? genericProfile(slug);
}

export function hasCustomProfile(slug: string): boolean {
  return slug in PROFILES;
}
