'use client';

import { Card, CardTitle } from '../_components/Card';
import { Badge } from '../_components/Badge';
import { Button } from '../_components/Button';
import { Table, type Column } from '../_components/Table';
import { useAdminData } from '../_lib/data';
import type { StockItem } from '../_lib/types';
import styles from './page.module.css';

export default function EstoquePage() {
  const { stock, stockMovements, registerStockEntry, showToast } = useAdminData();
  const lowStock = stock.filter((s) => s.qty < s.min);

  function handleAdd(item: StockItem) {
    registerStockEntry(item.id);
    showToast(`Entrada registrada: ${item.lot} ${item.unit} de ${item.name}`);
  }

  const cols: Column<StockItem>[] = [
    { key: 'name', header: 'Item', render: (i) => i.name },
    { key: 'kind', header: 'Tipo', render: (i) => i.kind },
    {
      key: 'balance',
      header: 'Saldo',
      render: (i) => {
        const low = i.qty < i.min;
        const pct = Math.min(100, (i.qty / (i.min * 2.5)) * 100);
        const markerPct = Math.min(100, (i.min / (i.min * 2.5)) * 100);
        return (
          <div className={styles.balance}>
            <span className={styles.balanceLabel}>
              {i.qty} {i.unit} · mín. {i.min} {i.unit}
            </span>
            <div className={styles.balanceTrack}>
              <div className={styles.balanceFill} style={{ width: pct + '%', background: low ? 'var(--danger)' : 'var(--accent)' }} />
              <div className={styles.balanceMarker} style={{ left: markerPct + '%' }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <Badge tone={i.qty < i.min ? 'danger' : 'ok'}>{i.qty < i.min ? 'Repor' : 'OK'}</Badge>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (i) => (
        <Button onClick={() => handleAdd(i)}>
          + {i.lot} {i.unit}
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {lowStock.length ? (
        <div className={styles.banner}>
          {lowStock.length} itens abaixo do mínimo: {lowStock.map((s) => s.name).join(', ')}
        </div>
      ) : null}

      <div className={styles.layout}>
        <Table columns={cols} rows={stock} />
        <Card>
          <CardTitle>Movimentações</CardTitle>
          <div className={styles.moveList}>
            {stockMovements.map((m) => (
              <div key={m.id} className={styles.moveRow}>
                <div className={styles.moveTop}>
                  <span>{m.time}</span>
                  <span>{m.qty}</span>
                </div>
                <span className={styles.moveDesc}>{m.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
