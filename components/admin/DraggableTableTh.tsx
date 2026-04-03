'use client';

import type { DragEvent, ReactNode, ThHTMLAttributes } from 'react';
import { ADMIN_TABLE_COLUMN_MIME } from '@/lib/adminTableColumnOrder';

export type DraggableTableThProps = {
  columnId: string;
  draggingColumnId: string | null;
  onColumnDragStart: (e: DragEvent, columnId: string) => void;
  onColumnDragEnd: () => void;
  onColumnDragOver: (e: DragEvent) => void;
  onColumnDrop: (e: DragEvent, columnId: string) => void;
  children: ReactNode;
} & Pick<ThHTMLAttributes<HTMLTableCellElement>, 'className' | 'style' | 'colSpan'>;

export function DraggableTableTh({
  columnId,
  draggingColumnId,
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDragOver,
  onColumnDrop,
  children,
  className,
  style,
  colSpan,
}: DraggableTableThProps) {
  return (
    <th
      className={className}
      colSpan={colSpan}
      style={{
        ...style,
        opacity: draggingColumnId === columnId ? 0.55 : 1,
      }}
      onDragOver={onColumnDragOver}
      onDrop={(e) => onColumnDrop(e, columnId)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          draggable
          onDragStart={(e) => onColumnDragStart(e, columnId)}
          onDragEnd={onColumnDragEnd}
          style={{
            cursor: 'grab',
            display: 'inline-flex',
            alignItems: 'center',
            flexShrink: 0,
            touchAction: 'none',
          }}
          title="Drag to reorder column"
          aria-label="Drag to reorder column"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="material-icons" style={{ fontSize: '16px', opacity: 0.45, color: 'var(--foreground)' }}>
            drag_indicator
          </span>
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
      </div>
    </th>
  );
}

export function setAdminTableColumnDragData(e: DragEvent, columnId: string) {
  e.dataTransfer.setData(ADMIN_TABLE_COLUMN_MIME, columnId);
  e.dataTransfer.effectAllowed = 'move';
}

export function getAdminTableColumnDragData(e: DragEvent): string {
  return e.dataTransfer.getData(ADMIN_TABLE_COLUMN_MIME);
}
