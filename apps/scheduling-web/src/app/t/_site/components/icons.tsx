import type { ReactNode, SVGProps } from 'react';

/**
 * Set único de ícones do site: grade 24px, traço 1.75, pontas e junções
 * retas (square/miter) — a mesma aresta seca da lâmina. Não misturar com
 * outros sets.
 */
function Icon({
  children,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = SVGProps<SVGSVGElement>;

export const IconUserOff = (p: P) => (
  <Icon {...p}>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3.5 20c.6-3.6 3.2-5.5 6.5-5.5 1.3 0 2.5.3 3.5.9M16 16l5 5M21 16l-5 5" />
  </Icon>
);

export const IconCalendarCheck = (p: P) => (
  <Icon {...p}>
    <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" />
  </Icon>
);

export const IconLink = (p: P) => (
  <Icon {...p}>
    <path d="M10 14l4-4M8.5 11.5l-2 2a3 3 0 004.2 4.2l2-2M15.5 12.5l2-2a3 3 0 00-4.2-4.2l-2 2" />
  </Icon>
);

export const IconClock = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 2" />
  </Icon>
);

export const IconCheck = (p: P) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const IconArrowLeft = (p: P) => (
  <Icon {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const IconPin = (p: P) => (
  <Icon {...p}>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0113 0c0 4.8-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </Icon>
);

export const IconChat = (p: P) => (
  <Icon {...p}>
    <path d="M4 19l1.3-3.6A7.5 7.5 0 1112 19.5a7.6 7.6 0 01-3.9-1.1z" />
  </Icon>
);

export const IconCamera = (p: P) => (
  <Icon {...p}>
    <path d="M4 4h16v16H4z" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M16.8 7.2h.01" />
  </Icon>
);

export const IconRotate = (p: P) => (
  <Icon {...p}>
    <path d="M4 12c0-2.5 3.6-4.5 8-4.5s8 2 8 4.5-3.6 4.5-8 4.5" />
    <path d="M9 14l3 2.5L9 19" />
  </Icon>
);

export const IconZoom = (p: P) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
  </Icon>
);

export const IconAlert = (p: P) => (
  <Icon {...p}>
    <path d="M12 3l9.5 17h-19zM12 10v4.5M12 17.2v.01" />
  </Icon>
);

export const IconCalendarPlus = (p: P) => (
  <Icon {...p}>
    <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M12 13v5M9.5 15.5h5" />
  </Icon>
);

export const IconCopy = (p: P) => (
  <Icon {...p}>
    <path d="M8 8h12v12H8z" />
    <path d="M16 8V4H4v12h4" />
  </Icon>
);

export const IconScissors = (p: P) => (
  <Icon {...p}>
    <circle cx="6" cy="7" r="2.5" />
    <circle cx="6" cy="17" r="2.5" />
    <path d="M8.2 8.3L20 17M8.2 15.7L20 7" />
  </Icon>
);

export const IconUser = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5" />
  </Icon>
);
