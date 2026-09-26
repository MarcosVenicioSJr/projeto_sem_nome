'use client';

import { Card, CardTitle } from '../_components/Card';
import { Button } from '../_components/Button';
import { Switch } from '../_components/Switch';
import { useAdminData } from '../_lib/data';
import { useShop } from '../_lib/shop';
import { brl } from '../_lib/format';
import styles from './page.module.css';

export default function SitePage() {
  const { services, products, site, toggleSiteSetting, showToast } = useAdminData();
  const { shop, publicBookingUrl } = useShop();

  const switches: Array<{ key: keyof typeof site; label: string; desc: string }> = [
    { key: 'online', label: 'Agendamento online', desc: 'Clientes marcam pelo link, 24h' },
    { key: 'precos', label: 'Mostrar preços', desc: 'Exibe o valor de cada serviço' },
    { key: 'escolher', label: 'Cliente escolhe o barbeiro', desc: 'Se desligado, o sistema distribui' },
    { key: 'produtos', label: 'Vitrine de produtos', desc: 'Lista os produtos à venda no balcão' },
  ];

  function copyLink() {
    try {
      navigator.clipboard.writeText(publicBookingUrl);
    } catch {
      // clipboard pode não estar disponível; o toast ainda confirma a ação.
    }
    showToast('Link copiado');
  }

  const activeServices = services.filter((s) => s.active).slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.settings}>
        <Card>
          <CardTitle>Seu link de agendamento</CardTitle>
          <div className={styles.linkRow}>
            <code className={styles.linkCode}>{publicBookingUrl}</code>
            <Button onClick={copyLink}>Copiar link</Button>
          </div>
          <p className={styles.hint}>Cole na bio do Instagram e no WhatsApp Business.</p>
        </Card>

        <Card>
          <CardTitle>Configurações da página</CardTitle>
          <div className={styles.switchList}>
            {switches.map((s) => (
              <div key={s.key} className={styles.switchRow}>
                <div className={styles.switchText}>
                  <span className={styles.switchLabel}>{s.label}</span>
                  <span className={styles.switchDesc}>{s.desc}</span>
                </div>
                <Switch checked={site[s.key]} onChange={() => toggleSiteSetting(s.key)} label={s.label} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.phoneFrame}>
        <div className={styles.phoneScreen}>
          {!site.online ? (
            <div className={styles.phoneOffline}>Agendamento online pausado. {shop.phone ? `Ligue ${shop.phone}.` : 'Ligue para a barbearia.'}</div>
          ) : (
            <>
              <div className={`${styles.phoneHeader} stripes`}>
                <div className={styles.phoneShopName}>{shop.name}</div>
                {shop.address ? <div className={styles.phoneAddress}>{shop.address}</div> : null}
              </div>
              <div className={styles.phoneBody}>
                <div>
                  <div className={styles.phoneSectionTitle}>Serviços</div>
                  {activeServices.map((s) => (
                    <div key={s.id} className={styles.phoneServiceRow}>
                      <span>{s.name}</span>
                      {site.precos ? <span className={styles.phonePrice}>{brl(s.price)}</span> : null}
                    </div>
                  ))}
                </div>

                {site.escolher ? (
                  <div>
                    <div className={styles.phoneSectionTitle}>Escolha o barbeiro</div>
                    <div className={styles.phoneAvatars}>
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={styles.phoneAvatar}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {site.produtos ? (
                  <div>
                    <div className={styles.phoneSectionTitle}>Produtos</div>
                    {products.slice(0, 3).map((p) => (
                      <div key={p.id} className={styles.phoneProduct}>
                        <span>{p.name}</span>
                        <span>{brl(p.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className={styles.phoneCta}>
                Agendar horário
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
