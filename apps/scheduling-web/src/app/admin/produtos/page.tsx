'use client';

import { useState } from 'react';
import type { Product } from '@org/contracts';
import { Button } from '../_components/Button';
import { Dialog } from '../_components/Dialog';
import { Field, Input } from '../_components/Field';
import { Table, type Column } from '../_components/Table';
import { useSession } from '../../_lib/session';
import { useAdminData } from '../_lib/data';
import { brl } from '../_lib/format';
import styles from './page.module.css';

const EMPTY = { name: '', category: '', price: '', cost: '', quantity: '0' };

/** Itens à venda no balcão, com quantidade própria (separada do estoque de consumíveis). */
export default function ProdutosPage() {
  const { productItems, loading, loadError, createProduct, updateProduct, removeProduct, showToast } = useAdminData();
  const { isManagement } = useSession();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown) => showToast(e instanceof Error ? e.message : 'Algo deu errado');

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, category: p.category ?? '', price: String(p.price), cost: String(p.cost), quantity: String(p.quantity) });
    setDialogOpen(true);
  }

  const valid = form.name.trim().length >= 2 && form.price !== '' && Number(form.price) >= 0 && Number(form.cost || 0) >= 0 && Number(form.quantity || 0) >= 0;

  async function handleSave() {
    const body = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      price: Number(form.price),
      cost: Number(form.cost || 0),
      quantity: Number(form.quantity || 0),
    };
    setBusy(true);
    try {
      if (editing) await updateProduct(editing.id, body);
      else await createProduct(body);
      showToast(editing ? `${body.name} atualizado` : `${body.name} cadastrado`);
      setDialogOpen(false);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(p: Product) {
    if (!window.confirm(`Excluir o produto "${p.name}"?`)) return;
    try {
      await removeProduct(p.id);
      showToast(`${p.name} excluído`);
    } catch (e) {
      fail(e);
    }
  }

  const cols: Column<Product>[] = [
    { key: 'name', header: 'Produto', render: (r) => r.name },
    { key: 'cat', header: 'Categoria', render: (r) => r.category ?? '—' },
    { key: 'price', header: 'Preço', render: (r) => brl(r.price) },
    { key: 'cost', header: 'Custo', render: (r) => brl(r.cost) },
    { key: 'margin', header: 'Margem', render: (r) => `${r.price > 0 ? Math.round(((r.price - r.cost) / r.price) * 100) : 0}%` },
    { key: 'qty', header: 'Em estoque', render: (r) => <span className={r.quantity === 0 ? styles.low : undefined}>{r.quantity}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button onClick={() => openEdit(r)}>Editar</Button>
          <Button variant="danger" onClick={() => handleRemove(r)}>
            Excluir
          </Button>
        </div>
      ),
    },
  ];

  if (!isManagement) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--muted)' }}>Somente o dono ou gerente gerencia os produtos.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div>
        <Button variant="primary" onClick={openNew}>
          + Novo produto
        </Button>
      </div>
      {loadError ? <p style={{ color: 'var(--danger)', fontSize: 13 }}>{loadError}</p> : null}
      {loading ? <p style={{ color: 'var(--muted)', fontSize: 13 }}>Carregando…</p> : <Table columns={cols} rows={productItems} />}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Editar produto' : 'Novo produto'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Categoria (opcional)">
            <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Field label="Preço (R$)">
              <Input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Custo (R$)">
              <Input type="number" min={0} step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
            <Field label="Quantidade">
              <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="primary" disabled={busy || !valid} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
