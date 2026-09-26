'use client';

import { useState } from 'react';
import type { StockItem } from '@org/contracts';
import { Badge } from '../_components/Badge';
import { Button } from '../_components/Button';
import { Dialog } from '../_components/Dialog';
import { Field, Input } from '../_components/Field';
import { Table, type Column } from '../_components/Table';
import { useSession } from '../../_lib/session';
import { useAdminData } from '../_lib/data';
import styles from './page.module.css';

type Adjust = { item: StockItem; direction: 1 | -1 };
const EMPTY_NEW = { name: '', unit: 'un', quantity: '0', minQuantity: '0' };

/** Consumíveis internos (lâmina, álcool, gel...). Controle manual, sem vínculo com atendimentos. */
export default function EstoquePage() {
  const {
    stockItems,
    loading,
    loadError,
    createStockItem,
    adjustStock,
    removeStockItem,
    showToast,
  } = useAdminData();
  const { isManagement } = useSession();
  const lowStock = stockItems.filter((s) => s.lowStock);

  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_NEW);
  const [adjust, setAdjust] = useState<Adjust | null>(null);
  const [amount, setAmount] = useState('1');
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) =>
    showToast(e instanceof Error ? e.message : 'Algo deu errado');

  async function handleCreate() {
    setBusy(true);
    try {
      await createStockItem({
        name: form.name.trim(),
        unit: form.unit.trim(),
        quantity: Number(form.quantity),
        minQuantity: Number(form.minQuantity),
      });
      showToast(`${form.name.trim()} cadastrado`);
      setNewOpen(false);
      setForm(EMPTY_NEW);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjust() {
    if (!adjust) return;
    setBusy(true);
    try {
      await adjustStock(adjust.item.id, adjust.direction * Number(amount));
      showToast(
        `${adjust.direction > 0 ? 'Entrada' : 'Saída'} registrada: ${amount} ${adjust.item.unit} de ${adjust.item.name}`,
      );
      setAdjust(null);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(item: StockItem) {
    if (!window.confirm(`Excluir "${item.name}" do estoque?`)) return;
    try {
      await removeStockItem(item.id);
      showToast(`${item.name} excluído`);
    } catch (e) {
      fail(e);
    }
  }

  const cols: Column<StockItem>[] = [
    { key: 'name', header: 'Item', render: (i) => i.name },
    {
      key: 'balance',
      header: 'Saldo',
      render: (i) => {
        const base = Math.max(i.minQuantity * 2.5, i.quantity, 1);
        const pct = Math.min(100, (i.quantity / base) * 100);
        const markerPct = Math.min(100, (i.minQuantity / base) * 100);
        return (
          <div className={styles.balance}>
            <span className={styles.balanceLabel}>
              {i.quantity} {i.unit} · mín. {i.minQuantity} {i.unit}
            </span>
            <div className={styles.balanceTrack}>
              <div
                className={styles.balanceFill}
                style={{
                  width: pct + '%',
                  background: i.lowStock ? 'var(--danger)' : 'var(--accent)',
                }}
              />
              <div
                className={styles.balanceMarker}
                style={{ left: markerPct + '%' }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => (
        <Badge tone={i.lowStock ? 'danger' : 'ok'}>
          {i.lowStock ? 'Repor' : 'OK'}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (i) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => {
              setAmount('1');
              setAdjust({ item: i, direction: 1 });
            }}
          >
            + Entrada
          </Button>
          <Button
            onClick={() => {
              setAmount('1');
              setAdjust({ item: i, direction: -1 });
            }}
          >
            − Saída
          </Button>
          {isManagement ? (
            <Button variant="danger" onClick={() => handleRemove(i)}>
              Excluir
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const validNew =
    form.name.trim().length >= 2 &&
    form.unit.trim().length > 0 &&
    Number(form.quantity) >= 0 &&
    Number(form.minQuantity) >= 0;

  return (
    <div className={styles.page}>
      {lowStock.length ? (
        <div className={styles.banner}>
          {lowStock.length} itens no mínimo ou abaixo:{' '}
          {lowStock.map((s) => s.name).join(', ')}
        </div>
      ) : null}

      {isManagement ? (
        <div>
          <Button variant="primary" onClick={() => setNewOpen(true)}>
            + Novo item
          </Button>
        </div>
      ) : null}

      {loadError ? (
        <p style={{ color: 'var(--danger)', fontSize: 13 }}>{loadError}</p>
      ) : null}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Carregando…</p>
      ) : (
        <Table columns={cols} rows={stockItems} />
      )}
      <p style={{ fontSize: 12, color: 'var(--muted)' }}>
        Estoque de consumíveis usados pelos profissionais (lâmina, álcool, gel).
        O controle é manual e independente dos atendimentos.
      </p>

      <Dialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Novo item de estoque"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <Field label="Nome">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Lâminas descartáveis"
            />
          </Field>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 12,
            }}
          >
            <Field label="Unidade">
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="un, cx, ml"
              />
            </Field>
            <Field label="Quantidade atual">
              <Input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
            <Field label="Mínimo (alerta)">
              <Input
                type="number"
                min={0}
                value={form.minQuantity}
                onChange={(e) =>
                  setForm({ ...form, minQuantity: e.target.value })
                }
              />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={() => setNewOpen(false)}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={busy || !validNew}
            onClick={handleCreate}
          >
            Cadastrar
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={adjust !== null}
        onClose={() => setAdjust(null)}
        title={
          adjust
            ? `${adjust.direction > 0 ? 'Entrada' : 'Saída'} · ${adjust.item.name}`
            : ''
        }
        subtitle={
          adjust
            ? `Saldo atual: ${adjust.item.quantity} ${adjust.item.unit}`
            : undefined
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Field label={`Quantidade (${adjust?.item.unit ?? ''})`}>
            <Input
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={() => setAdjust(null)}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={busy || !(Number(amount) > 0)}
            onClick={handleAdjust}
          >
            Registrar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
