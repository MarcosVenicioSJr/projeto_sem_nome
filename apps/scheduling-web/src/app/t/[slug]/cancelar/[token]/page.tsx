import type { Metadata } from 'next';
import { getShopProfile } from '../../../_site/content';
import { CancelBooking } from '../../../_site/agendar/CancelBooking';

type Params = Promise<{ slug: string; token: string }>;

export const metadata: Metadata = {
  title: 'Cancelar horário',
  robots: { index: false },
};

/** Link secreto enviado na confirmação: cancela sem login, até 2h antes. */
export default async function CancelarPage({ params }: { params: Params }) {
  const { slug, token } = await params;
  return <CancelBooking profile={getShopProfile(slug)} token={token} />;
}
