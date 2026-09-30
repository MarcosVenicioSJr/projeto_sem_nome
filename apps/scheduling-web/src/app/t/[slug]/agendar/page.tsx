import type { Metadata } from 'next';
import { getShopProfile } from '../../_site/content';
import { BookingFlow } from '../../_site/agendar/BookingFlow';

type Params = Promise<{ slug: string }>;
type Search = Promise<{ servico?: string | string[] }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = getShopProfile(slug).name || 'Barbearia';
  return { title: `Agendar · ${name}`, robots: { index: false } };
}

/** Agendamento público: serviço → profissional → horário → dados. */
export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const { servico } = await searchParams;
  return (
    <BookingFlow
      profile={getShopProfile(slug)}
      initialServiceId={Array.isArray(servico) ? servico[0] : servico}
    />
  );
}
