import React from 'react';
import { TABLE_HEADER_BG, TABLE_BORDER } from './chartTheme';
import styles from './dashboard.module.css';

interface Column<T> {
  header: string;
  accessor: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyAccessor: (row: T) => string;
}

function DataTable<T>({ columns, data, keyAccessor }: DataTableProps<T>) {
  return (
    <table className={styles.table}>
      <thead style={{ background: TABLE_HEADER_BG }}>
        <tr>
          {columns.map(col => (
            <th key={col.header} className={styles.th}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(row => (
          <tr key={keyAccessor(row)} style={{ borderBottom: `1px solid ${TABLE_BORDER}` }}>
            {columns.map(col => (
              <td key={col.header} className={styles.td}>{col.accessor(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DataTable;
