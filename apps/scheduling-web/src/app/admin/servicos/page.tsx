'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Chip } from '../_components/Chip';
import { Button } from '../_components/Button';
import { Switch } from '../_components/Switch';
import { Dialog } from '../_components/Dialog';
import { Field, Input, Select } from '../_components/Field';
import { Table, type Column } from '../_components/Table';
import { Icon } from '../_lib/icons';
import { useAdminData } from '../_lib/data';
import { SERVICE_CATEGORIES } from '../_lib/mock-data';
import { brl } from '../_lib/format';
import type { Service, ServiceCategory } from '../_lib/types';
import styles from './page.module.css';

const CATEGORY_FILTERS = ['Todos', ...SERVICE_CATEGORIES] as const;

export default function ServicosPage() {
  const { services, toggleServiceActive, createService, showToast } = useAdminData();
  const [category, setCategory] = useState<(typeof CATEGORY_FILTERS)[number]>('Todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Cabelo' as ServiceCategory, duration: 30, price: '' });

  const filtered = services.filter((s) => category === 'Todos' || s.category === category);
  const activeCount = services.filter((s) => s.active).length;
  const valid = form.name.trim().length >= 2 && Number(form.price) > 0;

  function handleToggle(service: Service) {
    toggleServiceActive(service.id);
    showToast(`${service.name} ${service.active ? 'oculto do agendamento' : 'disponível para agendamento'}`);
  }

  function handleSave() {
    if (!valid) return;
    createService({ name: form.name.trim(), category: form.category, duration: form.duration, price: Number(form.price) });
    showToast(`Serviço ${form.name.trim()} criado`);
    setDialogOpen(false);
    setForm({ name: '', category: 'Cabelo', duration: 30, price: '' });
  }

  const cols: Column<Service>[] = [
    { key: 'name', header: 'Serviço', render: (s) => <span className={styles.serviceName}>{s.name}</span> },
    { key: 'cat', header: 'Categoria', render: (s) => s.category },
    { key: 'dur', header: 'Duração', render: (s) => `${s.duration} min` },
    { key: 'price', header: 'Preço', render: (s) => brl(s.price) },
    {
      key: 'active',
      header: 'No agendamento',
      align: 'right',
      render: (s) => <Switch checked={s.active} onChange={() => handleToggle(s)} label={`Disponibilizar ${s.name} no agendamento`} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {CATEGORY_FILTERS.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className={styles.right}>
          <span className={styles.count}>
            {activeCount} ativos de {services.length}
          </span>
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Icon name="plus" size={16} /> Novo serviço
          </Button>
        </div>
      </div>

      <Table columns={cols} rows={filtered} />

      <p className={styles.note}>
        A comissão de cada serviço segue a % fixa do barbeiro que atendeu.{' '}
        <Link href="/admin/equipe?tab=comissoes">Ajustar em Equipe › Comissões</Link>
      </p>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Novo serviço">
        <div className={styles.formCol}>
          <Field label="Nome">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Corte masculino" />
          </Field>
          <div className={styles.formRow}>
            <Field label="Categoria">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duração (min)">
              <Input
                type="number"
                min={15}
                max={90}
                step={5}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Preço (R$)">
            <Input type="number" min={0} step={5} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
        </div>
        <div className={styles.dialogActions}>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="primary" disabled={!valid} style={{ opacity: valid ? 1 : 0.45 }} onClick={handleSave}>
            Criar serviço
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
