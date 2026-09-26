'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '../_components/Button';
import { Dialog } from '../_components/Dialog';
import { Field, Input } from '../_components/Field';
import { Table, type Column } from '../_components/Table';
import { Icon } from '../_lib/icons';
import { useSession } from '../../_lib/session';
import { useAdminData } from '../_lib/data';
import { brl } from '../_lib/format';
import type { Service as CatalogService } from '@org/contracts';
import styles from './page.module.css';

type OfferDraft = { on: boolean; price: string; duration: string };

export default function ServicosPage() {
  const { catalog, offers, team, loading, loadError, createService, removeService, saveOffer, removeOffer, showToast } = useAdminData();
  const { isManagement } = useSession();

  const [newOpen, setNewOpen] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<CatalogService | null>(null);
  const [drafts, setDrafts] = useState<Record<string, OfferDraft>>({});
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => showToast(e instanceof Error ? e.message : 'Algo deu errado');

  async function handleCreate() {
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      await createService(name.trim());
      showToast(`Serviço ${name.trim()} criado`);
      setNewOpen(false);
      setName('');
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(service: CatalogService) {
    if (!window.confirm(`Excluir o serviço "${service.name}"?`)) return;
    try {
      await removeService(service.id);
      showToast(`Serviço ${service.name} excluído`);
    } catch (e) {
      fail(e);
    }
  }

  function openOffers(service: CatalogService) {
    const initial: Record<string, OfferDraft> = {};
    for (const member of team) {
      const offer = offers.find((o) => o.serviceId === service.id && o.professionalId === member.id);
      initial[member.id] = {
        on: !!offer,
        price: offer ? String(offer.price) : '',
        duration: offer ? String(offer.durationMinutes) : '30',
      };
    }
    setDrafts(initial);
    setEditing(service);
  }

  const draftValid = (d: OfferDraft) => !d.on || (Number(d.price) >= 0 && d.price !== '' && Number(d.duration) >= 5);
  const allValid = Object.values(drafts).every(draftValid);

  async function handleSaveOffers() {
    if (!editing || !allValid) return;
    setBusy(true);
    try {
      for (const member of team) {
        const draft = drafts[member.id];
        const existing = offers.find((o) => o.serviceId === editing.id && o.professionalId === member.id);
        if (!draft) continue;
        if (draft.on) {
          const price = Number(draft.price);
          const duration = Number(draft.duration);
          if (!existing || existing.price !== price || existing.durationMinutes !== duration) {
            await saveOffer(member.id, editing.id, price, duration);
          }
        } else if (existing) {
          await removeOffer(member.id, editing.id);
        }
      }
      showToast(`Profissionais de ${editing.name} atualizados`);
      setEditing(null);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const cols: Column<CatalogService>[] = [
    { key: 'name', header: 'Serviço', render: (s) => <span className={styles.serviceName}>{s.name}</span> },
    {
      key: 'pros',
      header: 'Quem faz · preço · duração',
      render: (s) => {
        const list = offers.filter((o) => o.serviceId === s.id);
        if (list.length === 0) return <span className={styles.none}>Ninguém ainda</span>;
        return (
          <div className={styles.tags}>
            {list.map((o) => (
              <span key={o.id} className={styles.tag}>
                {team.find((m) => m.id === o.professionalId)?.name.split(' ')[0] ?? '—'} · {brl(o.price)} · {o.durationMinutes} min
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <div className={styles.actions}>
          <Button onClick={() => openOffers(s)}>Profissionais</Button>
          {isManagement ? (
            <Button variant="danger" onClick={() => handleRemove(s)}>
              Excluir
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <span className={styles.count}>{catalog.length} serviços</span>
        {isManagement ? (
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            <Icon name="plus" size={16} /> Novo serviço
          </Button>
        ) : null}
      </div>

      {loadError ? <p className={styles.note}>{loadError}</p> : null}
      {loading ? <p className={styles.note}>Carregando…</p> : <Table columns={cols} rows={catalog} />}

      <p className={styles.note}>
        Cada profissional escolhe os serviços que faz e define o próprio preço e duração. A comissão segue a % fixa de quem atendeu.{' '}
        <Link href="/admin/equipe?tab=comissoes">Ajustar em Equipe › Comissões</Link>
      </p>

      <Dialog open={newOpen} onClose={() => setNewOpen(false)} title="Novo serviço">
        <div className={styles.formCol}>
          <Field label="Nome" hint="Preço e duração são definidos por profissional, depois de criar.">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Corte masculino" />
          </Field>
        </div>
        <div className={styles.dialogActions}>
          <Button onClick={() => setNewOpen(false)}>Cancelar</Button>
          <Button variant="primary" disabled={busy || name.trim().length < 2} onClick={handleCreate}>
            Criar serviço
          </Button>
        </div>
      </Dialog>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Quem faz ${editing.name}` : ''}>
        <div className={styles.formCol}>
          {team.map((member) => {
            const draft = drafts[member.id];
            if (!draft) return null;
            const set = (patch: Partial<OfferDraft>) => setDrafts((prev) => ({ ...prev, [member.id]: { ...draft, ...patch } }));
            return (
              <div key={member.id} className={styles.offerRow}>
                <label className={styles.offerName}>
                  <input type="checkbox" checked={draft.on} onChange={(e) => set({ on: e.target.checked })} />
                  {member.name}
                </label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Preço"
                  aria-label={`Preço de ${member.name}`}
                  disabled={!draft.on}
                  value={draft.price}
                  onChange={(e) => set({ price: e.target.value })}
                />
                <Input
                  type="number"
                  min={5}
                  max={720}
                  step={5}
                  placeholder="Min"
                  aria-label={`Duração de ${member.name} em minutos`}
                  disabled={!draft.on}
                  value={draft.duration}
                  onChange={(e) => set({ duration: e.target.value })}
                />
              </div>
            );
          })}
          {team.length === 0 ? <p className={styles.note}>Cadastre profissionais em Equipe primeiro.</p> : null}
        </div>
        <div className={styles.dialogActions}>
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="primary" disabled={busy || !allValid} onClick={handleSaveOffers}>
            Salvar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
