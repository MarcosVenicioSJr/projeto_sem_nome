'use client';

import { useState } from 'react';
import { slugSchema } from '@org/contracts';
import { Card, CardTitle } from '../_components/Card';
import { Avatar } from '../_components/Avatar';
import { Button } from '../_components/Button';
import { Switch } from '../_components/Switch';
import { Tabs } from '../_components/Tabs';
import { Field, Input, Select } from '../_components/Field';
import { useAdminData } from '../_lib/data';
import { useShop } from '../_lib/shop';
import styles from './page.module.css';

type ConfigTab = 'dados' | 'horarios' | 'regras' | 'usuarios';

const LEAD_OPTIONS = [
  { value: 0, label: 'Sem mínimo' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1h' },
  { value: 120, label: '2h' },
];

const HORIZON_OPTIONS = [7, 15, 30, 60];

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<ConfigTab>('dados');
  const { hours, toggleHourOpen, updateHourRange, rules, toggleRule, updateRules, showToast } = useAdminData();
  const { shop, updateShop } = useShop();

  const [form, setForm] = useState({
    name: shop.name,
    slug: shop.slug,
    cnpj: shop.cnpj ?? '',
    phone: shop.phone ?? '',
    address: shop.address ?? '',
  });

  const slugValid = slugSchema.safeParse(form.slug).success;

  function handleSaveShop() {
    if (!slugValid || form.name.trim().length < 2) return;
    updateShop({ name: form.name.trim(), slug: form.slug.trim().toLowerCase(), cnpj: form.cnpj, phone: form.phone, address: form.address });
    showToast('Alterações salvas');
  }

  return (
    <div className={styles.page}>
      <Tabs
        items={[
          { key: 'dados', label: 'Dados da barbearia' },
          { key: 'horarios', label: 'Horários' },
          { key: 'regras', label: 'Regras de agendamento' },
          { key: 'usuarios', label: 'Usuários' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'dados' ? (
        <Card>
          <div className={styles.formGrid}>
            <Field label="Nome da barbearia">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Endereço do link" hint={!slugValid ? 'Use letras minúsculas, números e hífens (3-60 caracteres).' : undefined}>
              <div className={styles.slugPrefix}>
                <span className={styles.slugPrefixLabel}>/t/</span>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className={!slugValid ? styles.error : undefined}
                />
              </div>
            </Field>
            <Field label="CNPJ">
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </Field>
            <Field label="Telefone/WhatsApp">
              <Input inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className={styles.fullRow}>
              <Field label="Endereço">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>
          </div>
          <Button variant="primary" disabled={!slugValid || form.name.trim().length < 2} onClick={handleSaveShop}>
            Salvar alterações
          </Button>
        </Card>
      ) : null}

      {tab === 'horarios' ? (
        <Card>
          {hours.map((h) => (
            <div key={h.day} className={styles.hoursRow}>
              <span className={styles.hoursDay}>{h.label}</span>
              <Switch checked={h.open} onChange={() => toggleHourOpen(h.day)} label={`Abrir aos ${h.label}`} />
              {h.open ? (
                <div className={styles.hoursRange}>
                  <Input
                    type="time"
                    className={styles.timeInput}
                    value={h.from}
                    onChange={(e) => updateHourRange(h.day, { from: e.target.value })}
                  />
                  <span>até</span>
                  <Input
                    type="time"
                    className={styles.timeInput}
                    value={h.to}
                    onChange={(e) => updateHourRange(h.day, { to: e.target.value })}
                  />
                </div>
              ) : (
                <span className={styles.closedLabel}>Fechado</span>
              )}
            </div>
          ))}
        </Card>
      ) : null}

      {tab === 'regras' ? (
        <Card>
          <div className={styles.selectRow}>
            <Field label="Antecedência mínima">
              <Select value={rules.minLeadMinutes} onChange={(e) => updateRules({ minLeadMinutes: Number(e.target.value) })}>
                {LEAD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Agenda aberta até">
              <Select value={rules.horizonDays} onChange={(e) => updateRules({ horizonDays: Number(e.target.value) })}>
                {HORIZON_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} dias
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className={styles.ruleRow}>
            <div className={styles.ruleText}>
              <span className={styles.ruleLabel}>Lembrete por WhatsApp</span>
              <span className={styles.ruleDesc}>24h antes, com botão para confirmar ou remarcar</span>
            </div>
            <Switch checked={rules.whatsappReminder} onChange={() => toggleRule('whatsappReminder')} label="Lembrete por WhatsApp" />
          </div>
          <Button variant="primary" onClick={() => showToast('Regras salvas')} style={{ marginTop: 16 }}>
            Salvar regras
          </Button>
        </Card>
      ) : null}

      {tab === 'usuarios' ? (
        <Card>
          <div className={styles.userRow}>
            <Avatar initials={shop.owner.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()} size={40} />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{shop.owner.name}</span>
              <span className={styles.userEmail}>{shop.owner.email}</span>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>Dono · Acesso total</span>
          </div>
          <p className={styles.userNote}>Somente administradores acessam o portal. Barbeiros são cadastrados em Equipe.</p>
        </Card>
      ) : null}
    </div>
  );
}
