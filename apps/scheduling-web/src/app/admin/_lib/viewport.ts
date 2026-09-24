'use client';

import { useEffect, useState } from 'react';

export type Viewport = {
  width: number;
  isMobile: boolean; // < 720
  isTablet: boolean; // 720 - 1099
  isDesktop: boolean; // >= 1100
};

function computeViewport(width: number): Viewport {
  return {
    width,
    isMobile: width < 720,
    isTablet: width >= 720 && width < 1100,
    isDesktop: width >= 1100,
  };
}

export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>(() =>
    computeViewport(typeof window !== 'undefined' ? window.innerWidth : 1280),
  );

  useEffect(() => {
    const onResize = () => setViewport(computeViewport(window.innerWidth));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return viewport;
}
