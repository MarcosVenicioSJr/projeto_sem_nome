import { getShopProfile } from '../_site/content';
import { SiteHome } from '../_site/home/SiteHome';

type Params = Promise<{ slug: string }>;

/** Site público da barbearia: vitrine + porta de entrada do agendamento. */
export default async function ShopSitePage({ params }: { params: Params }) {
  const { slug } = await params;
  return <SiteHome profile={getShopProfile(slug)} />;
}
