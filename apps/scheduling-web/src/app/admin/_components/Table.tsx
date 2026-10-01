import type { ReactNode } from 'react';
import styles from './Table.module.css';

export type Column<Row> = {
  key: string;
  header: string;
  width?: string;
  render: (row: Row) => ReactNode;
  align?: 'left' | 'right' | 'center';
};

export function Table<Row extends { id: string }>({
  columns,
  rows,
}: {
  columns: Column<Row>[];
  rows: Row[];
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width, textAlign: c.align ?? 'left' }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align ?? 'left' }}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
