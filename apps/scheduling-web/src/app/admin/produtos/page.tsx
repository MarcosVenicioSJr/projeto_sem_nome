'use client';

import { Table, type Column } from '../_components/Table';
import { useAdminData } from '../_lib/data';
import { brl } from '../_lib/format';
import type { Product } from '../_lib/types';
import styles from './page.module.css';

export default function ProdutosPage() {
  const { products, stock } = useAdminData();

  const rows = products.map((p) => {
    const stockItem = stock.find((s) => s.id === p.stockId);
    const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;
    const low = stockItem ? stockItem.qty < stockItem.min : false;
    return { ...p, stockItem, margin, low };
  });

  const cols: Column<(typeof rows)[number]>[] = [
    { key: 'name', header: 'Produto', render: (r) => r.name },
    { key: 'cat', header: 'Categoria', render: (r) => r.category },
    { key: 'price', header: 'Preço', render: (r) => brl(r.price) },
    { key: 'cost', header: 'Custo', render: (r) => brl(r.cost) },
    { key: 'margin', header: 'Margem', render: (r) => `${r.margin}%` },
    {
      key: 'stock',
      header: 'Estoque',
      align: 'right',
      render: (r) => (
        <span className={r.low ? styles.low : undefined}>
          {r.stockItem ? `${r.stockItem.qty} ${r.stockItem.unit}` : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <Table columns={cols} rows={rows} />
    </div>
  );
}
